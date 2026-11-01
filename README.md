# HP / MP Status Bars

Owlbear Rodeo 2 擴充功能：在角色 Token 右側顯示共享的 HP／MP 狀態條。所有房間玩家都能看見，並可透過選取 Token 編輯數值。

## 功能摘要

- 選取 CHARACTER 層角色 Token，設定／修改 HP、MP
- 狀態條顯示在 Token 右側（文字 + 長條，長條略覆蓋文字）
- 長條寬度約 2 格；文字 0.2 格、長條 0.35 格、重疊 0.05 格
- 資料存在 Token Metadata，場景內所有玩家同步
- 支援場景切換復原、Token 刪除／複製後的狀態條調和

## 需求環境

- Node.js 18+（建議 20+）
- npm
- Owlbear Rodeo 帳號與房間

## 專案結構

```text
src/
  App.tsx                 # Extension 主介面
  config.ts               # Extension ID／Metadata key（請改 AUTHOR_ID）
  components/             # 表單與提示元件
  obr/                    # Owlbear SDK：選取、Metadata、狀態條、同步
  utils/                  # 驗證、比例、版面計算
  types/                  # 型別
  styles/                 # CSS
public/
  manifest.json           # Owlbear Extension 清單
  icon.svg
```

## 安裝依賴

在專案資料夾執行：

```bash
npm install
```

## 本機開發

### 1. 啟動開發伺服器

```bash
npm run dev
```

預設網址：`http://localhost:5173/`

### 2. 在 Owlbear 加入 Extension（僅你自己測試）

1. 打開 [Owlbear Rodeo](https://www.owlbear.rodeo/)
2. 個人資料 → **Add Extension**
3. 安裝連結貼上：

```text
http://localhost:5173/manifest.json
```

4. 建立或開啟房間，啟用「HP / MP Status Bars」
5. 點左上角 Extension 圖示開始使用

> `localhost` **只有你這台電腦**能載入。其他玩家會看到 `Unable to load extension: localhost`。

### 3. 多人測試（暫時公開網址）

請先保持 `npm run dev` 運作，再開一個終端機建立隧道，例如：

```bash
npx cloudflared tunnel --url http://localhost:5173
```

終端機會顯示類似：

```text
https://xxxx.trycloudflare.com
```

然後：

1. 在 Owlbear 把 Extension 安裝連結改成：

```text
https://xxxx.trycloudflare.com/manifest.json
```

2. **房間內每位玩家都要用同一個公開網址**加入／啟用
3. 重新整理房間後再測同步

隧道關閉後網址會失效，僅適合臨時測試。

## 常用指令

```bash
npm run dev         # 開發伺服器
npm run typecheck   # TypeScript 檢查
npm run build       # 正式建置（輸出到 dist/）
npm run preview     # 預覽建置結果
```

## 使用方式

1. 在地圖選取**一個** CHARACTER 層角色 Token
2. 打開本 Extension
3. 填寫角色名稱、目前／最大 HP、目前／最大 MP
4. 按「儲存」→ Token 右側出現狀態條
5. 「移除狀態顯示」只刪 Metadata 與狀態條，**不會刪 Token**

### 數值規則

- HP／MP 必須是有限數字
- 最大值必須大於 0
- 當前值不可小於 0，也不可大於最大值
- 降低最大值導致當前值超標時，會提示你自行修正（不會偷偷截斷）

## 重要設定

編輯 `src/config.ts`：

```ts
export const AUTHOR_ID = "yourname";
```

請改成你自己的識別名稱，避免與其他 Extension 的 Metadata 衝突。改完後需重新建置／重新載入。

`public/manifest.json` 的 `author`、`name` 也可一併修改。

## 用 GitHub Pages 公開部署

> 本專案**不會**自動上傳。以下步驟需你自行在 GitHub 建立 repo 並推送。

專案已備好 `.github/workflows/deploy-github-pages.yml`：推到 `main` 後會自動建置並部署。

### 1. 在 GitHub 建立 Repository

1. 開啟 [https://github.com/new](https://github.com/new)
2. 建立一個**公開** repo（例如 `owlbear-hp-mp-status`）
3. 不要勾選「Add a README」（本機已有專案）

### 2. 在本機初始化並推送

在專案資料夾執行（把 `你的帳號` 與 `repo名稱` 換成自己的）：

```bash
git init
git add .
git commit -m "Initial commit: Owlbear HP/MP status bars"
git branch -M main
git remote add origin https://github.com/你的帳號/repo名稱.git
git push -u origin main
```

### 3. 開啟 GitHub Pages

1. 打開 repo → **Settings** → **Pages**
2. **Source** 選 **GitHub Actions**
3. 到 **Actions** 分頁，確認 `Deploy to GitHub Pages` 工作流程成功（綠勾）

第一次可能要到 Actions 裡按 **Approve**／允許 Pages 部署。

### 4. 取得 Manifest 網址

部署成功後網址格式為：

```text
https://你的帳號.github.io/repo名稱/manifest.json
```

用瀏覽器開啟確認能看到 JSON。

### 5. 在 Owlbear 安裝

1. Owlbear → Extensions → Add Extension
2. 貼上上面的 `manifest.json` 完整網址
3. 房間內所有玩家都用**同一個**網址安裝

本機開發仍可用 `http://localhost:5173/manifest.json`；公開對局請改用 GitHub Pages 網址。

### 其他主機（選用）

也可把 `npm run build` 產生的 `dist/` 丟到 Cloudflare Pages / Netlify / Vercel。

## 已知限制（第一版）

- 只處理 CHARACTER 層 Image Token
- 不做 GM／玩家所有權限制（所有人皆可編輯）
- 狀態條外觀為實用版長條，非完整角色卡 UI
- 本機 `localhost` 無法給其他玩家使用

## 授權與依賴

- `@owlbear-rodeo/sdk`
- React + Vite + TypeScript
