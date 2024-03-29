<template>
  <div class="create-server-result-wrap">
    <page-footer>
      <template v-slot:left>
        <div
          v-for="(tip, idx) of tips"
          :key="idx"
          class="d-flex flex-column justify-content-center flex-grow-1 content">
          <div
            v-for="obj of tip"
            :key="obj.label"
            class="d-flex align-items-center">
            <span class="label" :class="obj.labelClass">{{ obj.label }}：</span>
            <template v-if="obj.value">
              <span class="value config text-truncate" :class="obj.valueClass">{{ obj.value }}</span>
            </template>
            <template v-else>
              <span class="value placeholder text-truncate" :class="obj.valueClass">------</span>
            </template>
          </div>
        </div>
      </template>
      <template v-slot:right>
        <div class="d-flex align-items-center">
          <div v-if="hasMeterService" class="mr-4 d-flex align-items-center">
            <div class="text-truncate">{{$t('compute.text_286')}}</div>
            <div class="ml-2 prices">
              <div class="hour d-flex">
                <template v-if="price">
                  <m-animated-number :value="originPrice" :formatValue="formatToPrice" />
                </template>
                <template v-else>---</template>
              </div>
              <div class="tips text-truncate">
                <span v-html="priceTips" />
              </div>
            </div>
          </div>
          <a-button
            :title="confirmText"
            class="text-truncate"
            size="large"
            type="primary"
            native-type="submit"
            html-type="submit"
            style="width: 120px;"
            :loading="loading"
            :disabled="disabled || !!errors.length">{{ confirmText }}</a-button>
        </div>
        <side-errors :error-title="$t('compute.text_290')" :errors="errors" @update:errors="changeErrors" />
      </template>
    </page-footer>
  </div>
</template>

<script>
import * as R from 'ramda'
import _ from 'lodash'
import { SERVER_TYPE, BILL_TYPES_MAP, EIP_TYPES_MAP } from '@Compute/constants'
import { sizestrWithUnit, sizestr } from '@/utils/utils'
import { HYPERVISORS_MAP, PROVIDER_MAP } from '@/constants'
import SideErrors from '@/sections/SideErrors'

export default {
  name: 'BottomBar',
  components: {
    SideErrors,
  },
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    form: {
      type: Object,
      required: true,
    },
    errors: {
      type: Object,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    resourceType: { // 资源池类型
      type: String,
    },
    isOpenWorkflow: {
      type: Boolean,
      default: false,
    },
    isServertemplate: {
      type: Boolean,
      default: false,
    },
    hasMeterService: {
      type: Boolean,
      default: true,
    },
    dataDiskSizes: {
      type: Array,
      default: () => [],
    },
  },
  data () {
    this.getPriceList = _.debounce(this._getPriceList, 500)
    return {
      pricesList: [],
      disabled: false,
    }
  },
  computed: {
    fd () {
      return this.form.fd
    },
    fi () {
      return this.form.fi
    },
    isPublic () {
      return this.type === SERVER_TYPE.public
    },
    isIDC () {
      return this.type === SERVER_TYPE.idc
    },
    // 是否为包年包月
    isPackage () {
      return this.fd.billType === BILL_TYPES_MAP.package.key
    },
    name () {
      return this.fd.name
    },
    zone () {
      let ret = this.fd.zone ? this.fd.zone.label : ''
      if (this.isPublic) {
        ret = this.fd.sku ? this.fd.sku.zone : ''
      }
      return ret
    },
    vmType () {
      let ret = this.$t('compute.text_291', [this.$t('dictionary.server')])
      if (this.fd.gpuEnable) {
        ret = `GPU${this.$t('dictionary.server')}`
      }
      return ret
    },
    dataDisk () {
      const diskValueArr = []
      R.forEachObjIndexed(value => {
        diskValueArr.push(value)
      }, this.fd.dataDiskSizes)
      return diskValueArr.reduce((prevDisk, diskValue) => prevDisk + diskValue, 0)
    },
    disk () {
      const diskValueArr = [this.fd.systemDiskSize]
      R.forEachObjIndexed(value => {
        diskValueArr.push(value)
      }, this.fd.dataDiskSizes)
      return diskValueArr.reduce((prevDisk, diskValue) => prevDisk + diskValue, 0)
    },
    config () {
      if (this.fd?.sku?.id) {
        return this.$t('compute.text_182', [
          this.fd.sku.name,
          this.fd.sku.instance_type_category_i18n,
          this.fd.sku.cpu_core_count,
          sizestr(this.fd.sku.memory_size_mb, 'M', 1024),
        ])
      }
      return null
    },
    image () {
      return _.get(this.fd, 'image.label') || ''
    },
    tips () {
      const ret = [
        [
          { label: this.$t('compute.text_175'), labelClass: 'label-w-120', value: this.vmType },
          { label: this.$t('compute.text_295'), labelClass: 'label-w-120', value: this.config },
        ],
        [
          { label: this.$t('compute.text_498'), labelClass: 'label-w-120', value: this.isPackage ? this.$t('billingType.prepaid') : this.$t('billingType.postpaid') },
          { label: this.$t('cloudenv.buy_num'), labelClass: 'label-w-120', value: `${this.fd?.count}${this.$t('common_62')}` },
        ],
        [
          { label: this.$t('compute.text_177'), labelClass: 'label-w-120', value: this.fd.sku?.region },
          { label: this.$t('compute.text_49'), labelClass: 'label-w-120', value: this.systemDisk },
        ],
      ]
      return ret
    },
    durationNum () {
      if (this.isPackage) {
        const { duration } = this.fd
        let num = parseInt(duration)
        if (num && duration.endsWith('Y')) {
          num *= 12 // 1年=12月
        } else if (num && duration.endsWith('W')) {
          num *= 0.25 // 1周=0.25月
        }
        return num
      }
      return 0
    },
    price () {
      const { count } = this.fd
      if (count && this.pricesList && this.pricesList.length > 0) {
        const { month_gross_price: month, sum_price: sum } = this.pricesList[0]
        let _price = parseFloat(sum)
        if (this.isPackage && this.durationNum) {
          _price = parseFloat(month) * this.durationNum
        }
        return _price * parseFloat(count)
      }
      return null
    },
    currency () {
      const currencys = {
        USD: '$',
        CNY: '¥',
      }
      if (this.pricesList && this.pricesList.length > 0) {
        return _.get(currencys, `[${this.pricesList[0].currency}]`) || currencys.CNY
      }
      return '¥'
    },
    priceTips () {
      if (this.originPrice) {
        if (this.isPackage && this.durationNum) {
          const _day = (this.originPrice / 30 / this.durationNum).toFixed(2)
          const _hour = (parseFloat(_day) / 24).toFixed(2)
          return this.$t('compute.text_1137', [this.currency, _day, this.currency, _hour])
        } else {
          const _day = (this.originPrice * 24).toFixed(2)
          const _month = (parseFloat(_day) * 30).toFixed(2)
          return this.$t('compute.text_1138', [this.currency, _day, this.currency, _month])
        }
      }
      return '--'
    },
    confirmText () {
      return this.$t('cloudenv.add_to_list')
    },
    dataDiskObj () {
      if (R.is(Object, this.fd.dataDiskTypes)) {
        const keys = Object.keys(this.fd.dataDiskTypes)
        if (keys && keys.length) {
          return this.fd.dataDiskTypes[keys[0]]
        }
      }
      if (R.is(Object, this.fd.dataDiskSizes)) {
        const keys = Object.keys(this.fd.dataDiskSizes)
        if (keys && keys.length) {
          const disk = this.fd[`dataDiskTypes[${keys[0]}]`]
          return disk
        }
      }
      return null
    },
    dataDiskType () {
      if (this.dataDiskObj && this.dataDiskObj.key) return this.dataDiskObj.key
      return ''
    },
    dataDiskLabel () {
      if (this.dataDiskObj && this.dataDiskObj.label) return this.dataDiskObj.label
      return ''
    },
    priceData () {
      const data = _.get(this.pricesList, '[0]', { discount: 1 })
      return data
    },
    originPrice () {
      const { count } = this.fd
      if (count && this.pricesList && this.pricesList.length > 0) {
        const { month_gross_price: month, hour_gross_price: sum } = this.pricesList[0]
        let price = 0
        let _price = parseFloat(sum)
        if (this.isPackage && this.durationNum) {
          _price = parseFloat(month) * this.durationNum
        }
        price = _price * parseFloat(count)
        this.$emit('getOriginPrice', price)
        return price
      }
      return null
    },
    systemDisk () {
      if (this.fd?.systemDiskSize) {
        return `${this.fd.systemDiskSize}GB ${_.get(this.fd, 'systemDiskType.label')}`
      }
      return '--'
    },
  },
  watch: {
    priceTips: {
      handler (val) {
        let ret = `${this.currency} ${this.originPrice && this.originPrice.toFixed(2)}`
        ret += !this.isPackage ? this.$t('compute.text_296') : ''
        this.$bus.$emit('VMGetPrice', `${ret} ${val}`)
      },
      immediate: true,
    },
    dataDiskType (val, oldV) {
      if (val !== oldV && this.isPublic) {
        this.getPriceList()
      }
    },
    'fd.eip_type' (val, oldV) {
      this.getPriceList()
    },
    'fd.eip_bw' (val, oldV) {
      this.getPriceList()
    },
    'fd.backupEnable' (val, oldV) {
      this.getPriceList()
    },
    'fd.eip_bgp_type' (val, oldV) {
      this.getPriceList()
    },
    'fd.gpuEnable' (val, oldV) {
      this.getPriceList()
    },
  },
  created () {
    this.baywatch([
      'fd.sku.id',
      'fd.gcounts',
      'fd.duration',
      'fd.billType',
      'fd.systemDiskSize',
      'fd.systemDiskType.key',
      'fd.count',
      'dataDiskSizes',
      'fd.gpu',
      'fd.gpuCount',
    ], (val) => {
      if (val) {
        this.getPriceList()
      }
    })
    this.$bus.$on('VMCreateDisabled', (val) => {
      this.disabled = val
    })
  },
  methods: {
    changeErrors (errors) {
      this.$emit('update:errors', {})
    },
    formatToPrice (val) {
      let ret = `${this.currency} ${val.toFixed(2)}`
      ret += !this.isPackage ? this.$t('compute.text_296') : ''
      return ret
    },
    baywatch (props, watcher) {
      const iterator = function (prop) {
        this.$watch(prop, watcher)
      }
      props.forEach(iterator, this)
    },
    // 获取总价格
    async _getPriceList () {
      if (!this.hasMeterService) return // 如果没有 meter 服务则取消调用
      if (R.isEmpty(this.fd.sku) || R.isNil(this.fd.sku)) return
      if (!R.is(Number, this.fd.count)) return
      let skuProvider = this.fd.sku.provider || PROVIDER_MAP.OneCloud.key
      const brand = PROVIDER_MAP[skuProvider].brand
      const params = {
        quantity: this.fd.count,
        brand,
      }
      if (this.isIDC && this.fd.eip_type === EIP_TYPES_MAP.new.key && this.fd.eip_bgp_type) {
        params.eip_bgp_type = this.fd.eip_bgp_type
      }
      if (this.isPublic) {
        if (this.fd.sku && this.fd.sku.cloud_env) {
          params.brand = this.fd.sku.cloud_env
          skuProvider = this.fd.sku.cloud_env
        }
      }
      const { systemDiskSize, systemDiskType } = this.fd
      const { systemDiskMedium, dataDiskMedium } = this.form.fi
      if (R.isNil(systemDiskSize)) return
      if (this.fi.createType !== SERVER_TYPE.public) {
        const diskSize = this.dataDisk || 0
        params.spec = `cpu=${this.fd.vcpu}core;mem=${sizestrWithUnit(this.fd.vmem, 'M', 1024)};disk=${systemDiskSize}GB,model=${systemDiskMedium}::${systemDiskType.key};disk=${diskSize}GB,model=${dataDiskMedium}::${this.dataDiskType}`
        if (this.fd.gpuEnable && this.fd.gpu) {
          const vendor = this.fd.gpu.split('=')[1]
          if (vendor) {
            const tmps = vendor.split(':')
            params.spec += `;gpu=${this.fd.gpuCount},model=${tmps[0]}.${tmps[1]}`
          }
        }
      } else {
        const { sku } = this.fd
        const { region_ext_id: regionExtId, name, zone_ext_id: zoneExtId } = sku
        const image = this.fi.imageMsg
        const osType = image.os_type ? image.os_type.toLowerCase() : ''
        params.region_id = regionExtId
        const provider = skuProvider.toLowerCase()
        // price_key
        if (provider === HYPERVISORS_MAP.ucloud.key || provider === HYPERVISORS_MAP.azure.key) {
          params.price_key = `${provider}::${regionExtId}::::instance::`
          if (sku.name) {
            params.price_key += `${sku.name}`
          }
        } else {
          params.price_key = `${regionExtId}::${name}::${osType}::${zoneExtId}`
        }
        // spec
        const isUcloudAzure = (provider === HYPERVISORS_MAP.ucloud.key || provider === HYPERVISORS_MAP.azure.key)
        params.spec = `${systemDiskSize}:${systemDiskType.key}`
        if (isUcloudAzure) {
          params.spec = `${systemDiskSize}:${provider}::${regionExtId}::::disk::${systemDiskType.key}`
        }
        const dataDiskSpec = []
        R.forEach((value) => {
          if (isUcloudAzure) {
            dataDiskSpec.push(`${value}:${provider}::${regionExtId}::::disk::${this.dataDiskType}`)
          } else {
            dataDiskSpec.push(`${value}:${this.dataDiskType}`)
          }
        }, this.dataDiskSizes)
        if (dataDiskSpec && dataDiskSpec.length > 0) {
          params.spec += `;${dataDiskSpec.join(';')}`
        }
        if (this.fd.billType === BILL_TYPES_MAP.package.key) {
          params.period = this.fd.duration
        }
        params.version = 'v2'
        if (R.isNil(params.region_id) || R.isEmpty(params.region_id)) return
      }
      if (R.isNil(params.brand) || R.isEmpty(params.brand)) return
      if (this.fd.eip_type === EIP_TYPES_MAP.new.key) {
        params.eip = this.fd.eip_bw + 'Mb'
      }
      if (this.fd.backupEnable) {
        params.backup_host = true
      }
      try {
        const { data: { data = [] } } = await new this.$Manager('price_infos', 'v1').get({ id: '', params })
        this.pricesList = data
      } catch (error) {
        throw error
      }
    },
  },
}
</script>

<style lang="less" scoped>
@import "../../../../../../src/styles/less/theme";

.create-server-result-wrap {
  position: relative;
  font-size: 12px;
  .content {
    width: 80%;
    .label {
      &.label-w-50 {
        width: 50px;
      }
      &.label-w-80 {
        width: 80px;
      }
      &.label-w-120 {
        width: 120px;
      }
    }
    .value {
      &.name-value {
        width: 100px;
      }
      &.placeholder {
        color: #888;
        font-style: italic;
      }
    }
    @media screen and (max-width: 1366px) {
      .value {
        max-width: 154px;
      }
    }
  }
  .prices {
    .hour {
      color: @error-color;
      font-size: 24px;
    }
    .tips {
      color: #999;
      font-size: 12px;
    }
  }
  .btns-wrapper {
    position: absolute;
    right: 20px;
  }
}
</style>
