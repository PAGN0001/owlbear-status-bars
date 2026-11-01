## 一、給 Cursor 的主要任務

你是一位熟悉 TypeScript、React、Vite 與 Owlbear Rodeo SDK 的前端工程師。請協助我從零建立一個可在 **Owlbear Rodeo 2** 中使用的 Extension，名稱暫定為 **HP / MP Status Bars**。

我沒有程式設計基礎。請使用清楚、容易維護的程式架構，避免不必要的複雜設計。請直接建立與修改專案檔案、安裝依賴、執行檢查，並在每個階段結束時用繁體中文說明完成了什麼、如何測試、目前還有哪些限制。

### 最重要的開發規則

1. **Owlbear SDK API 必須以官方最新文件及已安裝的 `@owlbear-rodeo/sdk` 型別定義為準。** 不要憑印象編造 API、Builder 方法、Manifest 欄位或權限名稱。
2. 如果文件與網路範例不一致，優先採用目前安裝套件的 TypeScript 型別與官方文件。
3. 遇到不確定的 API，先查官方文件或套件型別，再寫程式；不要用猜測的 API 交付。
4. 不要只產生程式碼片段。請建立完整可執行的專案。
5. 每完成一個階段，都要執行 TypeScript 檢查及 production build，修正錯誤後再繼續。
6. 不要擅自加入帳號系統、外部資料庫、雲端伺服器或付費服務。第一版只使用 Owlbear SDK。
7. 所有使用者介面文字使用繁體中文；角色狀態標籤保留 `HP`、`MP`。
8. 程式碼請加入必要註解，尤其是 Owlbear SDK 同步、Token 附件及 Metadata 管理部分。

---

## 二、產品需求

### 目標

製作一個在 Owlbear Rodeo 地圖中使用的角色狀態顯示工具。每個角色 Token 附近都會顯示自己的：

- 角色名稱
- HP 血量條
- MP 魔力條
- 當前值 / 最大值

所有房間玩家都能看見場景中已設定的角色狀態。當任何玩家修改數值時，其他玩家應能透過 Owlbear 場景同步看到更新。

### 已確定的設計選擇

- **資訊可見性：** 所有玩家都能看到彼此的 HP / MP。
- **顯示位置：** 顯示在角色 Token 附近，並隨 Token 移動。
- **數值調整：** 只使用數字輸入欄位，不需要加減按鈕。
- **頭像：** 第一版直接使用 Token 自身圖片，不另外上傳頭像。
- **角色名稱：** 預設讀取 Token 的名稱；若 SDK 的 Token 型別或實際資料不支援，提供可編輯的角色顯示名稱。
- **HP 顏色：** 紅色。
- **MP 顏色：** 藍色。
- **背景：** 深灰色。
- **外觀：** 簡潔、清楚，接近我提供的參考圖：左側圓形角色 Token，右側角色名稱與兩條狀態條。
- **第一版只處理 Owlbear 場景中的角色 Token（CHARACTER layer）。**

### 數值欄位

每個 Token 需要保存：

```ts
type CharacterStatus = {
  characterName: string;
  currentHP: number;
  maxHP: number;
  currentMP: number;
  maxMP: number;
};
```

資料範例：

```json
{
  "characterName": "以利亞・伯納德",
  "currentHP": 35,
  "maxHP": 50,
  "currentMP": 12,
  "maxMP": 20
}
```

請使用專屬且不會與其他 Extension 衝突的 Metadata key，例如：

```ts
const EXTENSION_ID = "com.yourname.hp-mp-status";
const STATUS_METADATA_KEY = `${EXTENSION_ID}/status`;
```

請把 `yourname` 做成容易修改的單一設定，不要在程式各處重複寫不同 ID。

---

## 三、核心功能規格

### A. 設定與修改角色數值

1. 玩家在地圖上選取一個 CHARACTER Token。
2. 玩家開啟本 Extension 的操作介面。
3. 介面讀取目前選取的 Token。
4. 若 Token 尚未設定狀態，顯示初始設定表單。
5. 若已經設定，顯示目前數值，允許修改。
6. 表單包含：
   - 角色名稱
   - 目前 HP
   - 最大 HP
   - 目前 MP
   - 最大 MP
7. 數值欄位使用 HTML number input。
8. 按下「儲存」後，將資料寫入該 Token 的 Metadata。
9. 儲存成功後，關閉或更新表單，並顯示清楚的成功提示。
10. 沒有選取 Token、選取多個 Token、選取非 CHARACTER Token 時，顯示清楚提示，不要讓程式崩潰。

### B. 數值驗證

請建立共用驗證函式：

- HP / MP 必須是有限數字。
- 最大 HP / MP 必須大於 0。
- 當前 HP / MP 不得小於 0。
- 當前 HP 不得大於最大 HP。
- 當前 MP 不得大於最大 MP。
- 不接受空白、NaN、Infinity。
- 儲存前顯示欄位錯誤，不要靜默改掉使用者輸入。
- 若使用者降低最大值，導致當前值超過最大值，請提示使用者修正，不要自行偷偷截斷。

### C. Token 附近的狀態條

請使用 Owlbear SDK 的 Scene Items 建立真正存在於場景中的狀態顯示物件，讓所有玩家都看得到，而不是只在 Extension iframe 內顯示一個面板。

狀態顯示物件應附著在對應 Token 上，並跟隨 Token 移動。請先確認官方文件中 `attachedTo`、Attachment Behavior、Item Builder 與位置座標的實際行為，再實作。

視覺組成可由數個 Scene Items 構成，例如：

- 角色名稱文字
- HP 背景條
- HP 前景填充條
- HP 數值文字
- MP 背景條
- MP 前景填充條
- MP 數值文字

如果使用多個 Item，請為每個狀態顯示物件寫入本 Extension 的 Metadata，記錄：
- 它屬於哪個 Token ID
- 它是該狀態顯示的哪個部分（例如 `hp-fill`、`mp-fill`、`hp-text`）
- 它的版本或識別資訊（如有需要）

**不得每次數值變動就新增一整組狀態條。** 必須先找出既有的狀態顯示物件並更新；只有不存在時才建立。刪除狀態時，應能安全刪除該 Token 對應的所有狀態顯示物件。

### D. 長條比例

HP 與 MP 分別計算：

```ts
const hpRatio = maxHP > 0 ? currentHP / maxHP : 0;
const mpRatio = maxMP > 0 ? currentMP / maxMP : 0;
```

顯示寬度必須限制在 0% 到 100%：

```ts
const hpPercent = Math.max(0, Math.min(1, hpRatio)) * 100;
const mpPercent = Math.max(0, Math.min(1, mpRatio)) * 100;
```

例如：
- HP 35 / 50 → 70%
- MP 12 / 20 → 60%
- HP 0 / 50 → 0%
- HP 50 / 50 → 100%

當數值改變時，應更新前景填充條的寬度與數字文字。

### E. 多人同步

1. 角色狀態資料儲存在該角色 Token 的 Scene Item Metadata。
2. 不要把角色 HP / MP 只存在 `OBR.player` Metadata，因為本工具的資料屬於 Token，且同一玩家可能有多個角色。
3. 使用官方 Scene Items API 讀取與更新場景物件。
4. 使用官方 `OBR.scene.items.onChange()` 監聽場景項目變化。
5. 當收到其他玩家的 Token Metadata 更新時，重新計算並更新對應狀態條。
6. 避免自己更新狀態條後觸發無限更新循環。可比較資料是否真的改變，並忽略純狀態顯示物件的無關更新。
7. 場景載入、切換場景、Extension 重新載入時，都要重新掃描 Token 並補齊狀態顯示。
8. 不要假設每個玩家都會以相同順序收到事件；同步處理必須可重複執行且不產生重複物件。

### F. 編輯權限（第一版簡化）

第一版先採用簡單、透明的規則：

- 所有玩家都可以看見所有已設定角色的狀態。
- 所有玩家都可以透過選取 Token 並開啟表單修改該 Token 的數值。
- 介面要明確顯示目前正在編輯哪個角色，避免改錯 Token。

暫時不實作 GM / 玩家所有權限制。未來可以再增加權限管理。

---

## 四、建議技術架構

請使用：

- TypeScript
- React
- Vite
- `@owlbear-rodeo/sdk`
- CSS（第一版不需要額外 UI 框架）

建議專案結構：

```text
hp-mp-status-extension/
├─ public/
│  ├─ manifest.json
│  └─ icon.svg
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ components/
│  │  ├─ StatusEditor.tsx
│  │  ├─ NumberField.tsx
│  │  └─ Notice.tsx
│  ├─ obr/
│  │  ├─ initialize.ts
│  │  ├─ selection.ts
│  │  ├─ tokenStatus.ts
│  │  └─ statusAttachments.ts
│  ├─ utils/
│  │  ├─ validation.ts
│  │  └─ ratio.ts
│  ├─ types/
│  │  └─ status.ts
│  └─ styles/
│     └─ main.css
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

可以依照實際實作調整檔案，但請維持職責清楚，不要把所有程式塞進單一檔案。

---

## 五、Owlbear SDK 開發注意事項

請以以下官方文件為起點，並在實作時自行查閱相關子頁與 TypeScript 型別：

- Extension 入門：<https://docs.owlbear.rodeo/extensions/getting-started/>
- Scene Items API：<https://docs.owlbear.rodeo/extensions/apis/scene/items/>
- Item Metadata：<https://docs.owlbear.rodeo/extensions/reference/metadata/>
- Item 型別：<https://docs.owlbear.rodeo/extensions/reference/items/item/>
- Shape Builder：<https://docs.owlbear.rodeo/extensions/reference/builders/shape/>
- Text Builder：<https://docs.owlbear.rodeo/extensions/reference/builders/text/>
- Player API：<https://docs.owlbear.rodeo/extensions/apis/player/>
- Scene API：<https://docs.owlbear.rodeo/extensions/apis/scene/>

重要提醒：

- `OBR.scene.items` 是共享場景物件 API；`OBR.scene.local` 是只顯示給目前使用者的本地物件 API。狀態條必須讓所有玩家看見，因此不要把主要狀態條放在 local items。
- Item 有 `metadata`、`attachedTo`、`layer`、`position` 等欄位，但實際建立與定位方式必須依照 SDK 型別及官方文件。
- `OBR.scene.items.onChange()` 的回呼可能在其他 Item 變更時也觸發。請做必要的篩選與差異比較。
- Scene Item 的 `metadata` key 必須使用 Extension 專屬命名空間。
- 請使用官方支援的 Builder 建立 Shape / Text，不要直接手寫不完整的 Item 物件。
- 請確認 Manifest schema 的正確欄位與格式，不要憑印象填寫。

---

## 六、Extension 介面

Extension 本身需要一個簡單的操作視窗：

### 未選取 Token

顯示：

「請先在地圖上選取一個角色 Token，再設定 HP / MP。」

### 已選取但尚未設定狀態

顯示標題：

「設定角色狀態」

欄位：
- 角色名稱
- 目前 HP
- 最大 HP
- 目前 MP
- 最大 MP

按鈕：
- 儲存
- 取消 / 清空表單

### 已選取且已有狀態

顯示標題：

「編輯角色狀態：角色名稱」

帶入現有數值，允許修改。

按鈕：
- 儲存變更
- 移除狀態顯示

移除狀態顯示時，請詢問確認，並刪除該 Token 的狀態 Metadata 與所有由本 Extension 建立的附件物件；不得刪除 Token 本身。

---

## 七、測試與驗收標準

完成後，請逐項測試並回報結果：

### 基本功能
- [ ] Extension 可以在 Owlbear Rodeo 載入。
- [ ] 可以選取 CHARACTER Token。
- [ ] 可以設定角色名稱、目前 HP、最大 HP、目前 MP、最大 MP。
- [ ] 儲存後，Token 附近出現名稱、HP、MP 狀態條。
- [ ] HP 與 MP 長條比例正確。
- [ ] 修改數值後，長條與數字會更新。
- [ ] 移動 Token 時，狀態顯示跟著移動。
- [ ] 重新載入 Extension 或重新進入場景後，狀態仍存在。
- [ ] 移除狀態時只刪除本 Extension 的資料與附件，不刪除 Token。

### 多人同步
- [ ] 兩個不同玩家同時進入同一房間。
- [ ] 玩家 A 修改角色 HP。
- [ ] 玩家 B 能看到 HP 更新。
- [ ] 玩家 B 修改 MP。
- [ ] 玩家 A 能看到 MP 更新。
- [ ] 不會因同步事件產生重複狀態條。

### 數值驗證
- [ ] 不接受負數。
- [ ] 不接受最大值為 0。
- [ ] 不接受當前值大於最大值。
- [ ] 不接受空白或非有限數字。
- [ ] 0 HP / 0 MP 顯示為空條。
- [ ] 滿 HP / 滿 MP 顯示為滿條。

### 建置檢查
- [ ] `npm run typecheck` 通過（若專案有設定此指令）。
- [ ] `npm run build` 通過。
- [ ] 沒有 TypeScript 錯誤。
- [ ] 沒有未處理的 SDK Promise rejection。
- [ ] Console 沒有持續重複觸發的錯誤或更新循環。

---

## 八、開發執行順序

請嚴格依照以下順序進行，不要一次做完所有功能卻沒有測試：

### Phase 1：建立可載入的 Extension
1. 建立 Vite + React + TypeScript 專案。
2. 安裝 `@owlbear-rodeo/sdk`。
3. 建立正確的 `manifest.json`。
4. 初始化 Owlbear SDK。
5. 建立最簡單的 Extension 介面，顯示「HP / MP Status Bars 已載入」。
6. 設定本機開發伺服器及建置指令。
7. 執行 typecheck 與 build。
8. 告訴我如何在 Owlbear Rodeo 中加入本機 Extension 測試。

完成 Phase 1 後先停下來，回報檔案結構、執行結果與測試步驟。不要在未確認 Phase 1 成功前擅自進入後續階段。

### Phase 2：Token 選取與 Metadata
1. 讀取目前選取的 Token。
2. 確認是否為 CHARACTER layer。
3. 讀取及更新 Token Metadata。
4. 建立表單及數值驗證。
5. 測試儲存後重新讀取資料。

### Phase 3：建立附著狀態條
1. 研究並確認 SDK 附件的座標、尺寸與行為。
2. 建立背景條、填充條及文字。
3. 將狀態顯示物件附著在正確 Token。
4. 建立穩定的附件識別方式。
5. 更新既有附件，不可重複建立。
6. 測試 Token 移動、縮放及旋轉時的顯示效果。

### Phase 4：多人同步與復原
1. 監聽場景 Item 變化。
2. 同步更新其他玩家畫面。
3. 處理場景切換及重新載入。
4. 處理 Token 刪除、複製及狀態移除。
5. 測試兩個瀏覽器／玩家連線。

### Phase 5：整理與交付
1. 修正所有測試問題。
2. 整理程式碼及註解。
3. 更新 README，使用繁體中文說明安裝、開發、測試。
4. 提供本機測試步驟。
5. 提供未來部署到公開網址的步驟，但不要未經我同意就發布或上傳任何內容。

---

## 九、Cursor 每階段回報格式

每完成一個 Phase，請用繁體中文回報：

1. **完成內容：** 這個階段新增了哪些功能。
2. **修改檔案：** 列出新增及修改的檔案。
3. **檢查結果：** TypeScript 與 build 是否通過。
4. **如何測試：** 用初學者能照著操作的步驟說明。
5. **已知問題：** 尚未解決或需要我在 Owlbear 中實測的項目。
6. **下一步：** 說明下一階段準備做什麼，等待我確認後再繼續。

現在請先執行 **Phase 1**。先檢查目前資料夾是否為空；如果已有檔案，先告訴我，不要覆蓋或刪除既有內容。接著建立專案並完成 Phase 1，完成後停下來等我測試。
