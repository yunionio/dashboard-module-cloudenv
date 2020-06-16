<template>
  <div>
    <a-divider orientation="left" class="mt-5 mb-3">
      {{ type === 'host' ? '配置物理机IP' : '配置虚拟机IP' }}
    </a-divider>
    <a-alert v-if="noSuitableIps && noSuitableIps.length > 0" class="mb-3" type="warning" show-icon>
      <template slot="message">
        发现该域子网目前不包含该账号下的IP为
          {{noSuitableIps.join(' | ')}}
        的虚拟机，您需要新建X个包含上诉虚拟机的IP,否则您可能无法正常使用上述虚拟机
      </template>
    </a-alert>
    <a-form-item label="IP子网">
      <a-radio-group v-if="type !== 'host'" v-decorator="['isCreate', { initialValue: true }]" button-style="solid">
        <a-radio-button :value="true">
          创建IP子网
        </a-radio-button>
        <a-radio-button :value="false">
          暂不创建
        </a-radio-button>
      </a-radio-group>
      <div v-show="form.fc.getFieldValue('isCreate') || form.fc.getFieldValue('isCreate') === undefined">
        <a-row :gutter="10" v-for="k in form.fc.getFieldValue('keys')" :key="k">
          <a-col :span="4">
            <a-form-item>
              <a-input  v-decorator="formatDecorator(k, 'name')" placeholder="子网名称" />
            </a-form-item>
          </a-col>
          <a-col :span="5">
            <a-form-item>
              <a-input @change="handleIpChange" v-decorator="formatDecorator(k, 'guest_ip_start')" placeholder="起始IP地址" />
            </a-form-item>
          </a-col>
          <a-col :span="5">
            <a-form-item>
              <a-input @change="handleIpChange" v-decorator="formatDecorator(k, 'guest_ip_end')" placeholder="结束IP地址" />
            </a-form-item>
          </a-col>
          <a-col :span="2">
            <a-form-item>
              <a-select class="w-100" v-decorator="formatDecorator(k, 'guest_ip_mask')">
                <a-select-option v-for="item in netMaskOptions" :key="item.value" :value="item.value">{{item.value}} </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="5">
            <a-form-item>
              <a-input v-decorator="formatDecorator(k, 'guest_gateway')" placeholder="默认网关地址" />
            </a-form-item>
          </a-col>
          <a-col :span="2" v-if="form.fc.getFieldValue('keys').length > 1">
            <a-button @click="handleRemove(k)" shape="circle" icon="minus" size="small" class="mt-2 ml-2" />
          </a-col>
        </a-row>
        <div class="d-flex align-items-center">
          <a-button type="primary" shape="circle" icon="plus" size="small" @click="handleAdd" />
          <a-button type="link" @click="handleAdd">添加新IP子网</a-button>
        </div>
      </div>
      <div v-show="!form.fc.getFieldValue('isCreate') && form.fc.getFieldValue('isCreate') !== undefined" class="mt-2">
          <a-alert message="提示:暂不创建子网,无法匹配网络的虚拟机同步下来IP会为空, 你也可以在导入云账号完成后在网络-IP子网 列表创建" type="warning" show-icon />
      </div>
    </a-form-item>
  </div>
</template>

<script>
import { uuid } from '@/utils/utils'

export default {
  name: 'PrepareNetsForm',
  props: {
    type: {
      type: String,
      default: 'host',
    },
    prepareNetData: {
      type: Object,
      required: true,
    },
    form: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      loading: false,
      netInit: {},
      netMaskOptions: [
        { label: '16', value: '16' },
        { label: '17', value: '17' },
        { label: '18', value: '18' },
        { label: '19', value: '19' },
        { label: '20', value: '20' },
        { label: '21', value: '21' },
        { label: '22', value: '22' },
        { label: '23', value: '23' },
        { label: '24', value: '24' },
        { label: '25', value: '25' },
        { label: '26', value: '26' },
        { label: '27', value: '27' },
        { label: '28', value: '28' },
        { label: '29', value: '29' },
        { label: '30', value: '30' },
      ],
      formLayout: {
        wrapperCol: {
          md: { span: 18 },
          xl: { span: 20 },
          xxl: { span: 22 },
        },
        labelCol: {
          md: { span: 6 },
          xl: { span: 3 },
          xxl: { span: 2 },
        },
      },
      options: {
        name: {
          initialValue: undefined,
          validateTrigger: ['change', 'blur'],
          validateFirst: true,
          rules: [
            { required: true, message: '请输入名称' },
            { validator: this.$validate('resourceName') },
          ],
        },
        guest_ip_start: {
          validateTrigger: ['change', 'blur'],
          validateFirst: true,
          rules: [
            { required: true, message: '请输入起始IP' },
            { validator: this.$validate('IPv4') },
          ],
        },
        guest_ip_end: {
          validateTrigger: ['change', 'blur'],
          validateFirst: true,
          rules: [
            { required: true, message: '请输入结束IP' },
            { validator: this.$validate('IPv4') },
          ],
        },
        guest_ip_mask: {
          initialValue: '24',
        },
        guest_gateway: {
          validateTrigger: ['change', 'blur'],
          validateFirst: true,
          rules: [
            { required: true, message: '请输入网关地址' },
            { validator: this.$validate('IPv4') },
            { validator: this.validateGateway },
          ],
        },
      },
    }
  },
  computed: {
    suggestedNetworks () {
      const _ = this.prepareNetData[`${this.type}_suggested_networks`]
      return _ && _.length > 0 ? _ : []
    },
    list () {
      if (this.prepareNetData && this.prepareNetData[`${this.type}s`] && this.prepareNetData[`${this.type}s`].length > 0) {
        return this.prepareNetData[`${this.type}s`]
      }
      return []
    },
    noSuitableIps () {
      const ips = []
      for (let i = 0; i < this.list.length; i++) {
        const item = this.list[i]
        if (!item.isSuitable && item.ips.length) {
          ips.push(...item.ips)
        }
      }
      return ips
    },
  },
  watch: {
    list (value) {
      if (value.length > 0 && !Object.keys(this.netInit).length) {
        this.initNets()
      }
    },
  },
  created () {
    this.form.fc.getFieldDecorator('keys', { initialValue: [], preserve: true })
    this.initNets()
  },
  methods: {
    formatDecorator (k, id) {
      return [`${k}.${id}`, {
        ...this.options[id],
        initialValue: this.netInit[k] ? this.netInit[k][id] : undefined,
      }]
    },
    initNets () {
      const keys = []
      if (this.suggestedNetworks && this.suggestedNetworks.length > 0) {
        this.suggestedNetworks.forEach(net => {
          const key = uuid()
          keys.push(key)
          this.netInit[key] = net
        })
      } else {
        keys.push(uuid())
      }
      this.form.fc.setFieldsValue({
        keys,
      })
    },
    setSuitable () {
      const values = this.form.fc.getFieldsValue()
      const ips = []
      values.keys.forEach(k => {
        const { guest_ip_start, guest_ip_end } = values[k]
        ips.push(guest_ip_start, guest_ip_end)
      })
      if (this.list && this.list.length > 0) {
        this.list.forEach(item => {
          for (let i = 0; i < item.ips.length; i++) {
            const ip = item.ips[i]
            item.isSuitable = ips.indexOf(ip) > -1
          }
        })
      }
    },
    async handleIpChange (e) {
      await this.$nextTick()
      this.setSuitable()
    },
    handleAdd () {
      const { fc } = this.form
      const keys = fc.getFieldValue('keys')
      const nextKeys = keys.concat(uuid())
      fc.setFieldsValue({
        keys: nextKeys,
      })
    },
    handleRemove (k) {
      const { fc } = this.form
      const keys = fc.getFieldValue('keys')
      fc.setFieldsValue({
        keys: keys.filter(_ => _ !== k),
      }, () => {
        this.setSuitable()
      })
    },
  },
}
</script>

<style>

</style>