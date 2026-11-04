# 函數、介面與 loop 的讀圖說明

四張圖分別呈現呼叫邊界、接件輪詢、派工紀錄狀態，以及 Skill 的工程交接。圖中的函數名稱來自公開版程式；Plan、Build、Verify、Review 則是 Markdown 指令定義的階段，沒有對應的 `plan()`／`build()` 執行引擎。

## 1. 接件的核心函數

| 函數 | 輸入 → 回傳 | 實際責任與副作用 |
| --- | --- | --- |
| `fetchIssues(config)` | `config.repo` → Issue 陣列 | 呼叫 `gh issue list`，取得最多 1,000 張開放 Issue 的 `number,url,state,author,labels`；失敗時拋錯。 |
| `chooseIssue({issues,boundary,author,active})` | Issue 與範圍條件 → `busy`、`idle` 或 `dispatch` | 純函數。active 存在就 busy；否則挑 `number > boundary`、OPEN、作者相同、有確切 `paseo` label 的最低編號 Issue。沒有候選就 idle。 |
| `dispatchOnce(config)` | config → 派工結果物件 | 依序呼叫 `assertRepo()`、`fetchIssues()`、`chooseIssue()`；僅 dispatch 分支寫 intent 並執行 Paseo。 |
| `writeAtomic(path,value)` | 路徑、JSON 物件 → 無回傳值 | 先寫同目錄 `.tmp`，再 rename 到目標檔。用於保存 config／active；不宣稱磁碟斷電時的 fsync 保證。 |
| `call(bin,argv,timeout)` | 執行檔、參數陣列、逾時 → trim 後的 stdout 字串 | 使用 `spawnSync`；執行錯誤或非零退出碼會拋錯。一般預設 20 秒，派工指定 120 秒。 |
| `withAsyncLock(fn)` | async callback → 等待 callback 完成 | 以 `wx` 建立 `owner.lock`；已有檔案便拒絕啟動。finally 關閉並刪除 lock，防止同目錄多個輪詢 owner。 |
| `cmdReconcile()` | CLI 的 Issue 編號、`--confirmed`、動作 → JSON 輸出 | `--agent ID` 更新 Session 回執；`--done` 刪除 active。兩者都不驗證遠端結果，核對由人完成。 |

`dispatchOnce()` 的宣告回傳不是 TypeScript 型別，下列為依程式整理的結果形狀：

```js
{ kind: 'idle' }
{ kind: 'busy', reason }
{ kind: 'dispatched', issue, agentId }
{ kind: 'dispatch-unknown', issue, reason }
```

`chooseIssue()` 選到候選時先回傳 `{kind:'dispatch', issue, url}`；這是內部選票結果，和遠端派工成功的 `dispatched` 不同。

## 2. 外部介面與回執

`config.json` 保存 `version, repo, author, boundary, workspace, provider, mode, every`。`cmdInit()` 從 GitHub 核對 repo／login 並取得邊界；初始化不會啟動 Agent。

接件器實際以參數陣列呼叫下列 Paseo CLI 介面，而非自行呼叫一個虛構的 Agent SDK：

```bash
paseo run \
  --workspace <config.workspace> \
  --title issue-<N>-coord \
  --provider <config.provider> \
  --mode <config.mode> \
  --no-wait --json <PROMPT>
```

`--no-wait` 要求 CLI 回傳而不等待 Agent 完成。腳本從 stdout JSON 嘗試讀取 `id`、`agent.id`、`session.id`、`agentId`、`sessionId` 中第一個 truthy 值，再要求它是非空字串。CLI 參數與 JSON 相容性仍須對照實際安裝版本；此 adapter 尚未完成 live E2E 驗收。

派工前的 `active.json`：

```json
{
  "issue": 42,
  "issueUrl": "https://github.com/example/repo/issues/42",
  "state": "dispatch-unknown",
  "createdAt": "<ISO_TIMESTAMP>"
}
```

取得可解析的 ID 後，保留原欄位，改為 `state: "dispatched"` 並加入 `agentId`。`createdAt` 記錄的是這次派工意圖的建立時間。Timeout、非零退出、JSON 或 ID 無法解析時，active 仍保留，下一輪回到 busy。

## 3. 三種 loop，不能混在一起

**接件輪詢：** `main()` 的 start 分支讀設定、解析間隔、取得 lock，再以 `while(running)` 呼叫 `dispatchOnce()`。輸出結果後等待，再回到查票。busy 仍會先查 GitHub，因為 `fetchIssues()` 在呼叫 `chooseIssue()` 前就執行。`assertRepo()`／`fetchIssues()` 的錯誤會退出，而不是自動吞錯重試。

**派工回執恢復：** unknown 不代表遠端失敗，先找原 Session。核對後使用 `reconcile --agent` 補上 ID；這不會清除 active。若已確認該票完成或已妥善處置阻礙，才使用 `--done`。

```bash
# 省略的 <skill-root> 是實際安裝的 Skill 目錄。
node <skill-root>/scripts/issue-intake.mjs reconcile \
  --issue 42 --confirmed --agent <EXISTING_SESSION_ID>

node <skill-root>/scripts/issue-intake.mjs reconcile \
  --issue 42 --confirmed --done
```

**候選修正：** Reviewer 的 `changes-requested` 或驗證失敗回到原 Builder。新 commit SHA 使受影響的證據失效，接著重新 Verify、Review。這一層由 Coordinator 按 Skill 文件協調，不是 `issue-intake.mjs` 自動執行。

## 4. 目前原型的重複接件限制

`--done` 僅刪除 `active.json`，沒有推進 boundary，也沒有 completed Issue 清單。因此「接下一輪」不等於「一定接下一張」。若原 Issue 仍開放、作者與 label 仍符合條件，最低編號的同一張票可能再次被選到。

已用純函數重現：同一份 Issue 輸入，active 為 null 時 dispatch；有 active 時 busy；再次設為 null 後仍 dispatch 同一編號。這次只修正文章與圖，不改接件器行為。進入無人值守用途之前，需要另外設計完成紀錄／去重與驗收。

## 5. Skill 交接介面

| 階段與指令來源 | 核心輸入 | 必須交回 |
| --- | --- | --- |
| Plan · `actions/plan.md` | Issue、採納留言、程式現況 | 計畫位置／版本、驗收條件、ready 或 blocked |
| Build · `actions/build.md` | 已接受計畫、指定 worktree、原 finding（修正時） | 已提交 SHA、完整變更集合、證據位置 |
| Verify · `actions/verify.md` | 固定 SHA、專案要求的檢查 | 每項驗收的 pass/fail/skip、命令、退出碼、環境、證據 |
| Review · `actions/review.md` | 原需求、計畫、完整 diff、驗證證據 | SHA、pass/changes-requested/blocked、finding 與處置 |
| Publish · `SKILL.md` | 同一候選的驗證與審查結果 | 讀回 PR 的 base/head/draft/SHA，未合併 Draft PR |

`progress.md` 是 Coordinator 維護的工程紀錄，保存候選、證據、Session 與外部回執；它和接件器的 `active.json` 沒有自動同步或完成通知介面。圖中沒有這條自動連線。

## 程式依據

- [接件與派工](https://github.com/wahengchang/agentic-engineering-skills/blob/main/skills/agentic-issue-delivery/scripts/issue-intake.mjs#L54-L79)
- [人工 reconcile](https://github.com/wahengchang/agentic-engineering-skills/blob/main/skills/agentic-issue-delivery/scripts/issue-intake.mjs#L108-L118)
- [輪詢與 owner lock](https://github.com/wahengchang/agentic-engineering-skills/blob/main/skills/agentic-issue-delivery/scripts/issue-intake.mjs#L120-L143)
- [純選票函數](https://github.com/wahengchang/agentic-engineering-skills/blob/main/skills/agentic-issue-delivery/scripts/intake-lib.mjs)
- [Skill 與交接契約](https://github.com/wahengchang/agentic-engineering-skills/blob/main/skills/agentic-issue-delivery/SKILL.md)
