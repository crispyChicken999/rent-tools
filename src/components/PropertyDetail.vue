<template>
  <el-drawer
    v-model="visible"
    title="房东详情"
    size="60%"
    :before-close="handleClose"
  >
    <div v-if="landlord" class="detail-content">
      <!-- 照片展示 -->
      <el-card class="photo-section" shadow="never">
        <template #header>
          <span>招租照片</span>
        </template>
        <el-image
          v-if="currentPhotoUrl"
          :src="currentPhotoUrl"
          fit="contain"
          style="width: 100%; max-height: 400px;"
          :preview-src-list="[currentPhotoUrl]"
          :initial-index="0"
        />
        <el-empty v-else description="暂无照片" />
      </el-card>

      <!-- 基本信息 -->
      <el-card class="info-section" shadow="never">
        <template #header>
          <span>基本信息</span>
        </template>
        
        <el-form :model="editForm" label-width="100px">
          <el-form-item label="房东类型">
            <el-select v-model="editForm.landlordType" placeholder="请选择">
              <el-option label="一手房东" :value="LandlordType.FirstHand" />
              <el-option label="二手房东" :value="LandlordType.SecondHand" />
              <el-option label="中介" :value="LandlordType.Agent" />
              <el-option label="其他" :value="LandlordType.Other" />
            </el-select>
          </el-form-item>

          <el-form-item label="电话号码">
            <el-tag
              v-for="(phone, index) in editForm.phoneNumbers"
              :key="index"
              closable
              @close="removePhone(index)"
              style="margin-right: 8px;"
            >
              {{ phone }}
            </el-tag>
            <el-input
              v-model="newPhone"
              placeholder="输入电话后按回车"
              style="width: 200px;"
              @keyup.enter="addPhone"
              @blur="checkPhoneDuplicate"
            />
          </el-form-item>

          <el-form-item label="备注名">
            <el-input v-model="editForm.alias" placeholder="例如：张阿姨" />
          </el-form-item>

          <el-form-item label="微信状态">
            <el-select v-model="editForm.wechatStatus">
              <el-option label="未添加" :value="WechatStatus.NotAdded" />
              <el-option label="已添加" :value="WechatStatus.Added" />
              <el-option label="已拒绝" :value="WechatStatus.Rejected" />
            </el-select>
          </el-form-item>

          <el-form-item label="微信昵称">
            <el-input v-model="editForm.wechatNickname" placeholder="微信昵称" />
          </el-form-item>

          <el-form-item label="联系状态">
            <el-select v-model="editForm.contactStatus">
              <el-option label="未联系" :value="ContactStatus.NotContacted" />
              <el-option label="已联系" :value="ContactStatus.Contacted" />
            </el-select>
          </el-form-item>

          <el-form-item label="位置">
            <el-input v-model="editForm.address" readonly />
          </el-form-item>

          <el-form-item label="GPS坐标">
            <el-input
              v-if="editForm.gps"
              :value="`${editForm.gps.lng.toFixed(6)}, ${editForm.gps.lat.toFixed(6)}`"
              readonly
            />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 公共费用 -->
      <el-card class="fees-section" shadow="never">
        <template #header>
          <span>公共费用标准</span>
        </template>
        
        <el-form :model="editForm" label-width="100px">
          <el-form-item label="押金方式">
            <el-select v-model="editForm.depositMethod" placeholder="请选择">
              <el-option label="押一付一" :value="DepositMethod.OneOne" />
              <el-option label="押一付二" :value="DepositMethod.OneTwo" />
              <el-option label="押一付三" :value="DepositMethod.OneThree" />
              <el-option label="押二付一" :value="DepositMethod.TwoOne" />
              <el-option label="押二付二" :value="DepositMethod.TwoTwo" />
              <el-option label="押二付三" :value="DepositMethod.TwoThree" />
              <el-option label="其他" :value="DepositMethod.Other" />
            </el-select>
          </el-form-item>

          <el-form-item label="电费(元/度)">
            <el-input-number v-model="editForm.electricity" :precision="2" :step="0.1" :min="0" />
          </el-form-item>

          <el-form-item label="水费(元/吨)">
            <el-input-number v-model="editForm.water" :precision="2" :step="0.1" :min="0" />
          </el-form-item>

          <el-form-item label="网费(元/月)">
            <el-input-number v-model="editForm.internet" :precision="0" :step="10" :min="0" />
          </el-form-item>

          <el-form-item label="管理费(元/月)">
            <el-input-number v-model="editForm.management" :precision="0" :step="10" :min="0" />
          </el-form-item>

          <el-form-item label="其他费用">
            <el-input v-model="editForm.otherFees" type="textarea" :rows="2" />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 房源信息 -->
      <el-card class="property-section" shadow="never">
        <template #header>
          <div class="card-header">
            <span>房源信息</span>
            <el-button type="primary" link @click="showAddProperty">添加房源</el-button>
          </div>
        </template>

        <el-table :data="editForm.properties || []" style="width: 100%">
          <el-table-column prop="roomType" label="房型">
            <template #default="{ row }">
              {{ row.roomType === RoomType.Single ? '单间' : 
                 row.roomType === RoomType.OneRoom ? '一房一厅' :
                 row.roomType === RoomType.TwoRoom ? '两房一厅' :
                 row.roomType === RoomType.ThreeRoom ? '三房一厅' : '其他' }}
            </template>
          </el-table-column>
          <el-table-column prop="rent" label="租金">
            <template #default="{ row }">
              {{ row.rent }}元/月
            </template>
          </el-table-column>
          <el-table-column prop="floor" label="楼层" />
          <el-table-column label="操作" width="150">
            <template #default="{ row, $index }">
              <el-button link type="primary" @click="editProperty(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteProperty($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" @click="saveChanges">保存修改</el-button>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="danger" @click="confirmDelete">删除此房东</el-button>
      </div>
    </div>

    <!-- 房源编辑弹窗 -->
    <el-dialog
      v-model="propertyDialogVisible"
      :title="isEditingProperty ? '编辑房源' : '添加房源'"
      width="500px"
      append-to-body
    >
      <el-form :model="currentProperty" label-width="80px">
        <el-form-item label="房型">
          <el-select v-model="currentProperty.roomType">
            <el-option label="单间" :value="RoomType.Single" />
            <el-option label="一房一厅" :value="RoomType.OneRoom" />
            <el-option label="两房一厅" :value="RoomType.TwoRoom" />
            <el-option label="三房一厅" :value="RoomType.ThreeRoom" />
            <el-option label="其他" :value="RoomType.Other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="租金">
          <el-input-number v-model="currentProperty.rent" :min="0" :step="100" />
          <span class="unit" style="margin-left: 10px">元/月</span>
        </el-form-item>

        <el-form-item label="楼层">
          <el-input v-model="currentProperty.floor" placeholder="例如：3楼" />
        </el-form-item>

        <el-form-item label="朝向">
          <el-select v-model="currentProperty.orientation">
            <el-option label="东" :value="Orientation.East" />
            <el-option label="南" :value="Orientation.South" />
            <el-option label="西" :value="Orientation.West" />
            <el-option label="北" :value="Orientation.North" />
            <el-option label="东南" :value="Orientation.Southeast" />
            <el-option label="西南" :value="Orientation.Southwest" />
            <el-option label="东北" :value="Orientation.Northeast" />
            <el-option label="西北" :value="Orientation.Northwest" />
          </el-select>
        </el-form-item>

        <el-form-item label="配置">
          <div class="appliances-grid" v-if="currentProperty.appliances">
            <el-checkbox v-model="currentProperty.appliances.airConditioner">空调</el-checkbox>
            <el-checkbox v-model="currentProperty.appliances.washingMachine">洗衣机</el-checkbox>
            <el-checkbox v-model="currentProperty.appliances.waterHeater">热水器</el-checkbox>
            <el-checkbox v-model="currentProperty.appliances.refrigerator">冰箱</el-checkbox>
            <el-checkbox v-model="currentProperty.appliances.bed">床</el-checkbox>
            <el-checkbox v-model="currentProperty.appliances.wardrobe">衣柜</el-checkbox>
            <el-checkbox v-model="currentProperty.appliances.internet">宽带</el-checkbox>
            <el-checkbox v-model="currentProperty.appliances.sofa">沙发</el-checkbox>
          </div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="currentProperty.notes" type="textarea" />
        </el-form-item>

        <el-form-item label="状态">
          <el-switch
            v-model="currentProperty.available"
            active-text="可租"
            inactive-text="已租"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="propertyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProperty">确定</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePropertyStore } from '@/stores/property'
import { LandlordType, WechatStatus, ContactStatus, DepositMethod, RoomType, Orientation } from '@/types'
import type { Landlord, Property, Appliances } from '@/types'
import { getValidDirectoryHandle, getFileByName } from '@/utils/fileSystem'

const propertyStore = usePropertyStore()

const visible = computed({
  get: () => !!propertyStore.currentLandlord,
  set: (val) => {
    if (!val) {
      propertyStore.setCurrentLandlord(null)
    }
  }
})

const landlord = computed(() => propertyStore.currentLandlord)

const editForm = ref<Partial<Landlord>>({})
const newPhone = ref('')
const currentPhotoUrl = ref('')

watch(landlord, async (newLandlord) => {
  if (newLandlord) {
    editForm.value = { ...newLandlord }
    await loadPhoto()
  } else {
    currentPhotoUrl.value = ''
  }
}, { immediate: true })

async function loadPhoto() {
  if (!landlord.value?.photos?.[0]) return

  try {
    const dirHandle = await getValidDirectoryHandle()
    if (!dirHandle) {
      ElMessage.warning('文件夹访问权限已失效，请重新选择')
      return
    }

    const photo = landlord.value.photos[0]
    const file = await getFileByName(dirHandle, photo.fileName)
    
    if (file) {
      currentPhotoUrl.value = URL.createObjectURL(file)
    }
  } catch (error) {
    console.error('加载照片失败:', error)
  }
}

// Property Dialog State
const propertyDialogVisible = ref(false)
const currentProperty = ref<Partial<Property>>({})
const isEditingProperty = ref(false)

// Property Methods
function showAddProperty() {
  currentProperty.value = {
    id: crypto.randomUUID(),
    roomType: RoomType.Single,
    rent: 0,
    available: true,
    appliances: {
      airConditioner: false,
      washingMachine: false,
      waterHeater: false,
      refrigerator: false,
      bed: false,
      wardrobe: false,
      internet: false,
      television: false,
      desk: false,
      chair: false,
      sofa: false,
      diningTable: false
    },
    videos: []
  }
  isEditingProperty.value = false
  propertyDialogVisible.value = true
}

function editProperty(property: Property) {
  currentProperty.value = JSON.parse(JSON.stringify(property))
  isEditingProperty.value = true
  propertyDialogVisible.value = true
}

function deleteProperty(index: number) {
  if (editForm.value.properties) {
    editForm.value.properties.splice(index, 1)
  }
}

function saveProperty() {
  if (!editForm.value.properties) {
    editForm.value.properties = []
  }

  if (isEditingProperty.value) {
    const index = editForm.value.properties.findIndex(p => p.id === currentProperty.value.id)
    if (index !== -1) {
      editForm.value.properties[index] = currentProperty.value as Property
    }
  } else {
    editForm.value.properties.push(currentProperty.value as Property)
  }
  propertyDialogVisible.value = false
}

function addPhone() {
  if (!newPhone.value.trim()) return
  
  if (!editForm.value.phoneNumbers) {
    editForm.value.phoneNumbers = []
  }
  
  if (editForm.value.phoneNumbers.includes(newPhone.value.trim())) {
    ElMessage.warning('电话号码已存在')
    return
  }

  editForm.value.phoneNumbers.push(newPhone.value.trim())
  newPhone.value = ''
}

function removePhone(index: number) {
  editForm.value.phoneNumbers?.splice(index, 1)
}

async function checkPhoneDuplicate() {
  if (!newPhone.value.trim()) return

  const duplicates = await propertyStore.checkPhoneDuplicate(newPhone.value.trim())
  
  if (duplicates.length > 0 && duplicates[0].id !== landlord.value?.id) {
    const duplicate = duplicates[0]
    
    ElMessageBox.confirm(
      `检测到该电话已存在于 [${duplicate.address || '未知地址'}] 的记录中。是否合并记录？`,
      '重复电话提示',
      {
        confirmButtonText: '合并',
        cancelButtonText: '独立保存',
        type: 'warning'
      }
    )
      .then(async () => {
        if (landlord.value) {
          await propertyStore.mergeLandlords(duplicate.id, landlord.value.id)
          ElMessage.success('记录已合并')
          propertyStore.setCurrentLandlord(null)
        }
      })
      .catch(() => {
        // 用户选择独立保存，继续添加
        addPhone()
      })
  }
}

async function saveChanges() {
  if (!landlord.value) return

  try {
    await propertyStore.updateLandlordData(landlord.value.id, {
      ...editForm.value,
      isPerfect: editForm.value.phoneNumbers && editForm.value.phoneNumbers.length > 0
    })
    
    ElMessage.success('保存成功')
    propertyStore.setCurrentLandlord(null)
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error.message}`)
  }
}

function handleClose() {
  // 释放 Blob URL
  if (currentPhotoUrl.value) {
    URL.revokeObjectURL(currentPhotoUrl.value)
  }
  propertyStore.setCurrentLandlord(null)
}

async function confirmDelete() {
  ElMessageBox.confirm('确定要删除此房东吗？此操作不可恢复。', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      if (landlord.value) {
        await propertyStore.removeLandlord(landlord.value.id)
        ElMessage.success('删除成功')
        propertyStore.setCurrentLandlord(null)
      }
    })
    .catch(() => {})
}
</script>

<style scoped>
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.appliances-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 5px;
}
</style>
