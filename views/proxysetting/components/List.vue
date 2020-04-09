<template>
  <page-list
    :list="list"
    :columns="columns"
    :group-actions="groupActions"
    :single-actions="singleActions"
    :export-data-options="exportDataOptions" />
</template>

<script>
import ColumnsMixin from '../mixins/columns'
import SingleActionsMixin from '../mixins/singleActions'
import { getNameFilter } from '@/utils/common/tableFilter'
import WindowsMixin from '@/mixins/windows'
import ListMixin from '@/mixins/list'

export default {
  name: 'ProxysettingList',
  mixins: [WindowsMixin, ListMixin, ColumnsMixin, SingleActionsMixin],
  props: {
    id: String,
    getParams: {
      type: Object,
    },
  },
  data () {
    return {
      list: this.$list.createList(this, {
        id: this.id,
        resource: 'proxysettings',
        getParams: this.getParams,
        filterOptions: {
          name: getNameFilter(),
          // https_proxy: {
          //   label: 'https代理',
          // },
          // http_proxy: {
          //   label: 'http代理',
          // },
          // no_proxy: {
          //   label: '不走代理地址',
          // },
        },
      }),
      exportDataOptions: {
        items: [
          { label: 'ID', key: 'id' },
          { label: '名称', key: 'name' },
          { label: 'https代理', key: 'https_proxy' },
          { label: 'http代理', key: 'http_proxy' },
          { label: '不走代理', key: 'no_proxy' },
        ],
      },
      groupActions: [
        {
          label: '新建',
          permission: 'proxysettings_create',
          action: () => {
            this.createDialog('ProxysettingCreateDialog', {
              onManager: this.onManager,
            })
          },
          meta: () => {
            return {
              buttonType: 'primary',
            }
          },
        },
        {
          label: '删除',
          permission: 'proxysettings_delete',
          action: () => {
            this.createDialog('DeleteResDialog', {
              data: this.list.selectedItems,
              columns: this.columns,
              title: '删除',
              onManager: this.onManager,
            })
          },
          meta: () => {
            return {
              validate: this.list.allowDelete(),
            }
          },
        },
      ],
    }
  },
  created () {
    this.list.fetchData()
  },
  methods: {
    commonMeta (row = {}) {
      const { id } = row
      const isDirect = id === 'DIRECT'
      return {
        isDirect,
        validate: !isDirect,
        tooltip: isDirect && '直连不支持此操作',
      }
    },
  },
}
</script>