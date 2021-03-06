import Cloudgroup from '@Cloudenv/views/cloudgroup'
import Cloudaccount from '@Cloudenv/views/cloudaccount'
import CloudaccountCreate from '@Cloudenv/views/cloudaccount/create'
import CloudaccountUpdateBill from '@Cloudenv/views/cloudaccount/create/BillFileIndex'
import Cloudregion from '@Cloudenv/views/cloudregion'
import Zone from '@Cloudenv/views/zone'
import Schedtag from '@Cloudenv/views/schedtag'
import Schedpolicy from '@Cloudenv/views/schedpolicy'
import Dynamicschedtag from '@Cloudenv/views/dynamicschedtag'
import Tag from '@Cloudenv/views/tag'
import Cloudevent from '@Cloudenv/views/cloudevent'
import Proxysetting from '@Cloudenv/views/proxysetting'
// import Policydefinition from '@Cloudenv/views/policydefinition'
import Layout from '@/layouts/RouterView'
import { hasSetupKey } from '@/utils/auth'

import store from '@/store'
import i18n from '@/locales'
import { isScopedPolicyMenuHidden } from '@/utils/scopedPolicy'

export default {
  index: 90,
  meta: {
    label: i18n.t('cloudenv.text_8'),
    icon: 'onecloud',
  },
  menus: [
    {
      meta: {
        label: i18n.t('cloudenv.text_9'),
      },
      submenus: [
        {
          path: '/cloudregion',
          meta: {
            label: i18n.t('cloudenv.text_10'),
            permission: 'areas_list',
            hidden: () => {
              if (isScopedPolicyMenuHidden('sub_hidden_menus.cloudregion')) {
                return true
              }
              return !hasSetupKey(['onestack', 'private', 'vmware'])
            },
          },
          component: Layout,
          children: [
            {
              name: 'Cloudregion',
              path: '',
              component: Cloudregion,
            },
          ],
        },
        {
          path: '/zone',
          meta: {
            label: i18n.t('cloudenv.text_11'),
            permission: 'zones_list',
            hidden: () => {
              if (isScopedPolicyMenuHidden('sub_hidden_menus.zone')) {
                return true
              }
              return !hasSetupKey(['onestack', 'private', 'vmware'])
            },
          },
          component: Layout,
          children: [
            {
              name: 'Zone',
              path: '',
              component: Zone,
            },
          ],
        },
      ],
    },
    {
      meta: {
        label: i18n.t('cloudenv.text_12'),
      },
      submenus: [
        {
          path: '/cloudaccount',
          meta: {
            label: i18n.t('cloudenv.text_12'),
            permission: 'cloudaccounts_list',
            hidden: () => {
              if (isScopedPolicyMenuHidden('sub_hidden_menus.cloudaccount')) {
                return true
              }
              return !hasSetupKey(['private', 'vmware', 'public', 'storage'])
            },
          },
          component: Layout,
          children: [
            {
              name: 'Cloudaccount',
              path: '',
              component: Cloudaccount,
            },
            {
              name: 'CloudaccountCreate',
              path: 'create',
              component: CloudaccountCreate,
            },
            {
              name: 'CloudaccountUpdateBill',
              path: 'updatebill',
              component: CloudaccountUpdateBill,
            },
          ],
        },
        {
          path: '/cloudgroup',
          meta: {
            label: i18n.t('cloudenv.text_491'),
            permission: 'cloudgroup_list',
            t: 'cloudenv.text_491',
            hidden: () => {
              if (isScopedPolicyMenuHidden('sub_hidden_menus.cloudgroup')) {
                return true
              }
              return store.getters.isProjectMode || !hasSetupKey(['aliyun', 'huawei', 'qcloud', 'aws', 'azure', 'google'])
            },
          },
          component: Layout,
          children: [
            {
              name: 'Cloudgroup',
              path: '',
              component: Cloudgroup,
            },
          ],
        },
        {
          path: '/proxysetting',
          meta: {
            label: i18n.t('cloudenv.text_14'),
            permission: 'proxysettings_list',
            hidden: () => {
              if (isScopedPolicyMenuHidden('sub_hidden_menus.proxysetting')) {
                return true
              }
              return !hasSetupKey(['private', 'vmware', 'public', 'storage'])
            },
          },
          component: Layout,
          children: [
            {
              name: 'Proxysetting',
              path: '',
              component: Proxysetting,
            },
          ],
        },
        {
          path: '/cloudevent',
          meta: {
            label: i18n.t('cloudenv.text_15'),
            permission: 'cloudevents_list',
            t: 'dictionary.cloudevents',
            hidden: () => {
              if (isScopedPolicyMenuHidden('sub_hidden_menus.cloudevent')) {
                return true
              }
              return !hasSetupKey(['aliyun', 'aws', 'azure', 'huawei', 'qcloud'])
            },
          },
          component: Layout,
          children: [
            {
              name: 'Cloudevent',
              path: '',
              component: Cloudevent,
            },
          ],
        },
      ],
    },
    {
      meta: {
        label: i18n.t('cloudenv.text_16'),
      },
      submenus: [
        {
          path: '/tag',
          meta: {
            label: i18n.t('cloudenv.text_16'),
            hidden: () => {
              if (isScopedPolicyMenuHidden('sub_hidden_menus.tag')) {
                return true
              }
              return false
            },
          },
          component: Layout,
          children: [
            {
              name: 'Tag',
              path: '',
              component: Tag,
            },
          ],
        },
      ],
    },
    /* {
      meta: {
        label: i18n.t('cloudenv.text_499'),
        hidden: () => !hasSetupKey(['onestack', 'private', 'public', 'vmware']),
      },
      submenus: [
        {
          path: '/strategyallocation',
          meta: {
            label: i18n.t('cloudenv.text_500'),
            permission: 'scopedpolicies_list',
          },
          component: Layout,
          children: [
            {
              name: 'Strategyallocation',
              path: '',
              component: Strategyallocation,
            },
          ],
        },
        {
          path: '/strategydefinition',
          meta: {
            label: i18n.t('cloudenv.text_501'),
            permission: 'scopedpolicies_list',
          },
          component: Layout,
          children: [
            {
              name: 'Strategydefinition',
              path: '',
              component: Strategydefinition,
            },
            {
              name: 'StrategydefinitionCreate',
              path: 'create',
              component: StrategydefinitionCreate,
            },
          ],
        },
      ],
    }, */
    {
      meta: {
        label: i18n.t('cloudenv.text_17'),
      },
      submenus: [
        {
          path: '/schedtag',
          meta: {
            label: i18n.t('cloudenv.text_18'),
            permission: 'schedtags_list',
            hidden: () => {
              if (isScopedPolicyMenuHidden('sub_hidden_menus.schedtag')) {
                return true
              }
              return false // !hasSetupKey(['onestack', 'openstack', 'dstack', 'zstack', 'vmware'])
            },
          },
          component: Layout,
          children: [
            {
              name: 'Schedtag',
              path: '',
              component: Schedtag,
            },
          ],
        },
        {
          path: '/schedpolicy',
          meta: {
            label: i18n.t('cloudenv.text_19'),
            permission: 'schedpolicies_list',
            hidden: () => {
              if (isScopedPolicyMenuHidden('sub_hidden_menus.schedpolicy')) {
                return true
              }
              return false // !hasSetupKey(['onestack', 'openstack', 'dstack', 'zstack', 'vmware'])
            },
          },
          component: Layout,
          children: [
            {
              name: 'Schedpolicy',
              path: '',
              component: Schedpolicy,
            },
          ],
        },
        {
          path: '/dynamicschedtag',
          meta: {
            label: i18n.t('cloudenv.text_20'),
            permission: 'dynamicschedtags_list',
            hidden: () => {
              if (isScopedPolicyMenuHidden('sub_hidden_menus.dynamicschedtag')) {
                return true
              }
              return false // !hasSetupKey(['onestack', 'openstack', 'dstack', 'zstack', 'vmware'])
            },
          },
          component: Layout,
          children: [
            {
              name: 'Dynamicschedtag',
              path: '',
              component: Dynamicschedtag,
            },
          ],
        },
      ],
    },
    /* {
      meta: {
        label: i18n.t('cloudenv.text_21'),
        hidden: true,
      },
      submenus: [
        {
          path: '/policydefinition',
          meta: {
            label: i18n.t('cloudenv.text_21'),
            permission: 'policydefinitions_list',
            hidden: () => !hasSetupKey(['onestack', 'openstack', 'dstack', 'zstack', 'vmware']),
          },
          component: Layout,
          children: [
            {
              name: 'Policydefinition',
              path: '',
              component: Policydefinition,
            },
          ],
        },
      ],
    }, */
  ],
}
