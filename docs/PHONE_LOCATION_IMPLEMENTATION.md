# 手机号归属地功能实现总结

## 已完成的工作

### 1. 创建了手机号归属地查询工具 ✅

- 文件: `src/utils/phoneLocation.ts`
- 功能:
  - `queryPhoneLocation()`: 单个手机号查询
  - `batchQueryPhoneLocation()`: 批量查询
  - 使用 uapis.cn API: `https://uapis.cn/api/v1/misc/phoneinfo?phone=xxx`
  - 返回格式: `{"province":"北京","city":"北京","sp":"移动"}`

### 2. 更新了数据类型定义 ✅

- 文件: `src/types/index.ts`
- 修改: `phoneNumbers: string[]` → `phoneNumbers: [string, string][]`
- 格式: `[手机号, 归属地信息]`

### 3. 实现了数据迁移 ✅

- 文件: `src/utils/storage.ts`
- 在 `getAllLandlords()` 中自动检测并转换旧格式数据
- 旧格式 `string[]` → 新格式 `[string, string][]`
- 迁移时归属地信息默认为空字符串

### 4. 更新了 Property Store ✅

- 文件: `src/stores/property.ts`
- 更新了所有访问 `phoneNumbers` 的地方:
  - `phoneCounts` 计算属性
  - `filteredLandlords` 中的电话筛选
  - `landlordSearchKeyword` 搜索
  - `hideRepeatedPhones` 和 `showRepeatedPhones` 筛选
  - `flattenedProperties` 中的 `landlordPhone`
  - `mergeLandlords` 合并逻辑

### 5. 更新了存储工具 ✅

- 文件: `src/utils/storage.ts`
- 修改 `findLandlordsByPhone()` 以支持新格式

## 待完成的工作

### 1. 更新 PropertyDetail 组件 ⏳

需要修改的内容:

- **模板部分** (lines 117-160):

  ```vue
  <!-- 当前 -->
  <el-input v-model="editForm.phoneNumbers[index]" />

  <!-- 需要改为 -->
  <el-input
    v-model="editForm.phoneNumbers[index][0]"
    @blur="updatePhoneLocation(index)"
  >
    <template #append>
      <el-tag v-if="editForm.phoneNumbers[index][1]">
        {{ editForm.phoneNumbers[index][1] }}
      </el-tag>
      <el-button :icon="Refresh" 
                 @click="refreshPhoneLocation(index)"
                 title="刷新归属地" />
    </template>
  </el-input>
  ```

- **脚本部分**:
  - 修改 `createEmptyForm()`: `phoneNumbers: [["", ""]]`
  - 修改数据初始化逻辑 (line 899-900)
  - 添加 `updatePhoneLocation(index)` 函数
  - 添加 `refreshPhoneLocation(index)` 函数
  - 修改 `addPhone()` 函数
  - 修改 `removePhone(index)` 函数
  - 修改 `checkDuplicatePhone()` 函数
  - 修改 `copyToClipboard()` 函数

### 2. 更新 PhotoUpload 组件 ⏳

需要修改的内容:

- **快速整理对话框**:

  - 修改 `currentPhones` 的初始化 (line 515-517)
  - 修改 `saveAndNext()` 函数 (line 731-755)
  - 修改 `saveCurrentLandlord()` 函数 (line 758-776)
  - 添加批量识别归属地按钮和功能

- **批量识别功能**:
  ```vue
  <el-button type="success" @click="batchRecognizeLocations">
    批量识别归属地
  </el-button>
  ```
  - 实现 `batchRecognizeLocations()` 函数
  - 遍历所有房东的电话号码
  - 调用 `batchQueryPhoneLocation()`
  - 更新数据库

### 3. 其他可能需要更新的组件 ⏳

- `LandlordList.vue`: 显示电话号码的地方
- `PropertyList.vue`: 显示电话号码的地方
- `LandlordFilter.vue`: 电话搜索功能
- `PropertyFilter.vue`: 电话搜索功能

## 实现细节

### 自动更新归属地 (input blur)

```typescript
const updatePhoneLocation = async (index: number) => {
  const phone = editForm.value.phoneNumbers[index][0];
  if (phone && phone.trim()) {
    const location = await queryPhoneLocation(phone);
    editForm.value.phoneNumbers[index][1] = location;
    // 自动保存到数据库
    await saveChanges();
  }
};
```

### 手动刷新归属地

```typescript
const refreshPhoneLocation = async (index: number) => {
  const phone = editForm.value.phoneNumbers[index][0];
  if (phone && phone.trim()) {
    ElMessage.info("正在查询归属地...");
    const location = await queryPhoneLocation(phone);
    editForm.value.phoneNumbers[index][1] = location;
    await saveChanges();
    ElMessage.success("归属地已更新");
  }
};
```

### 批量识别归属地 (PhotoUpload)

```typescript
const batchRecognizeLocations = async () => {
  const landlords = propertyStore.landlords;
  let totalPhones = 0;
  let updatedCount = 0;

  ElMessageBox.confirm(
    `将为所有房东的电话号码识别归属地，是否继续？`,
    "批量识别",
    { type: "warning" }
  ).then(async () => {
    scanning.value = true;

    for (const landlord of landlords) {
      const phones = landlord.phoneNumbers;
      const needsUpdate = phones.some(([_, location]) => !location);

      if (needsUpdate) {
        const phoneNumbers = phones.map(([phone]) => phone);
        const locations = await batchQueryPhoneLocation(
          phoneNumbers,
          (current, total) => {
            progress.value = Math.round((current / total) * 100);
          }
        );

        const updatedPhones: [string, string][] = phones.map(
          ([phone], index) => [phone, locations[index] || ""]
        );

        await propertyStore.updateLandlordData(landlord.id, {
          phoneNumbers: updatedPhones,
        });

        updatedCount++;
      }
      totalPhones += phones.length;
    }

    scanning.value = false;
    ElMessage.success(
      `已更新 ${updatedCount} 个房东的 ${totalPhones} 个电话号码归属地`
    );
  });
};
```

## 注意事项

1. **数据迁移**: 已在 `getAllLandlords()` 中自动处理，无需手动迁移
2. **API 限流**: 360 API 可能有频率限制，批量查询时已添加 300ms 延迟
3. **错误处理**: 查询失败时返回空字符串，不影响正常使用
4. **兼容性**: 新旧数据格式可以共存，迁移是自动的
5. **性能**: 批量查询时显示进度条，避免用户等待焦虑

## 下一步行动

1. 更新 PropertyDetail 组件的电话号码输入部分
2. 更新 PhotoUpload 组件的快速整理功能
3. 添加批量识别归属地功能
4. 测试数据迁移和新功能
5. 更新其他相关组件的显示逻辑
