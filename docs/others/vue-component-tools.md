# vue组件封装

#### 一、人员选择器

::: details 点击查看代码

```vue
   <template>
    <div>
        <el-popover :placement="placement" :width="panelWidth" trigger="click" v-model="visible">
            <el-input slot="reference" v-model="userName" readonly :style="{ width: width + 'px' }" :size="size"
                :placeholder="placeholder">
                <span slot="append" v-if="selectedRows.length > 1">+{{ selectedRows.length - 1 }}</span>
            </el-input>
            <div style="margin-bottom: 0.5em" v-if="selectedRows.length">
                <el-button size="mini" icon="el-icon-delete" @click="clearSelected"
                    :title="$t('poer.clearSelection')" />
                <div style="max-height: 100px; overflow-x: hidden; overflow-y: auto">
                    <el-tag style="margin: 3px" v-for="item in selectedRows" :key="item.user_id" :closable="true"
                        @close="delRow(item)">
                        {{ item.user_name }}
                    </el-tag>
                </div>
            </div>
            <div>
                <div style="margin-bottom: 0.5em">
                    <el-input size="mini" v-model="searchText" :placeholder="$t('tips.pleaseEnterName')" clearable>
                        <el-button slot="append" size="mini" icon="el-icon-search" @click="GetUserData(true)" />
                    </el-input>
                </div>
                <el-table :data="userData" @row-click="rowClick" size="mini" :show-header="true"
                    :row-class-name="tableRowClassName">
                    <el-table-column v-if="showID" property="user_id" label="ID" show-overflow-tooltip />
                    <el-table-column property="user_name" :label="$tc('personal.name')" show-overflow-tooltip />
                </el-table>
                <el-pagination small background :current-page="currentPage" :total="total" :page-size="pageSize"
                    layout="prev,next,total,jumper" @current-change="handleCurrentChange"
                    style="margin-top: 5px; text-align: left">
                </el-pagination>
            </div>
        </el-popover>
    </div>
</template>
<script>
export default {
    name: 'user-select',
    model: {
        prop: 'value',
        event: 'change'
    },
    props: {
        value: {
            //多选为Array
            type: [Array, Number, String]
        },
        width: {
            //el-input的宽度
            type: Number,
            default: 200
        },
        panelWidth: {
            //el-input的宽度
            type: Number,
            default: 300
        },
        size: {
            //el-input的尺寸大小
            type: String,
            default: 'small'
        },
        pageSize: {
            //分页尺寸，默认10
            type: Number,
            default: 10
        },
        placeholder: {
            //el-input的placeholder
            type: String,
            default: '请选择人员'
        },
        multiple: {
            //是否多选
            type: Boolean,
            default: false
        },
        change: {
            type: Function
        },
        showID: {
            //是否展示ID
            type: Boolean,
            default: true
        },
        placement: {
            type: String,
            default: 'right'
        }
    },
    data() {
        return {
            valueData: null,
            visible: false,
            total: 0,
            searchText: null,
            selectedRows: [],
            currentPage: 1,
            userData: []
        };
    },

    computed: {
        userName: function () {
            if (this.selectedRows.length) {
                let row = this.selectedRows[this.selectedRows.length - 1];
                return row.user_name;
            } else {
                return '';
            }
        }
    },
    watch: {
        value(newValue, oldValue) {
            // console.log(typeof newValue);
            // console.log(newValue instanceof Array);
            // console.log(newValue instanceof Number);
            // console.log(newValue instanceof String);
            // if (newValue) {
            //     console.log(newValue.constructor === Array);
            //     console.log(newValue.constructor === String);
            // }
            this.valueData = newValue;
            // console.log(`子组件值：${newValue}`);
        }
    },
    mounted() {
        this.InitData();
        this.GetUserData(true);
    },
    methods: {
        InitData() {
            let _this = this;
            this.valueData = this.value;
            // console.log(this.valueData);
            // console.log(this.value);
            let idArr = [];
            if (this.valueData) {
                if (this.multiple) {
                    if (this.valueData instanceof Array) {
                        idArr = this.valueData;
                    }
                } else {
                    if (this.valueData.constructor === String || this.valueData.constructor === Number) idArr.push(this.valueData);
                }
            }

            // console.log(idArr);
            if (idArr.length) {
                let reqParam = {
                    ids: idArr
                };
                this.$store.dispatch('userSimplelist', reqParam).then((res) => {
                    // console.log(res);
                    if (res) {
                        for (let item of res) {
                            _this.selectedRows.push(item);
                        }
                    }
                });
            }
        },
        GetUserData(isFirstLoad) {
            let _this = this;
            if (isFirstLoad) {
                _this.currentPage = 1;
            }
            let reqParam = {
                keyword: _this.searchText,
                page: _this.currentPage,
                limit: _this.pageSize
            };

            this.$store.dispatch('userSimple2Page', reqParam).then((res) => {
                // console.log(res);
                if (res) {
                    _this.userData = res.list;
                    _this.total = res.total;
                }
            });
        },
        rowClick(row) {
            if (this.multiple) {
                let idx = this.selectedRows.findIndex((item) => item.user_id === row.user_id);
                // console.log(idx)
                if (idx >= 0) {
                    this.delRow(row);
                    return;
                }
                this.selectedRows.push(row);
            } else {
                this.selectedRows = [];
                this.selectedRows.push(row);
                this.visible = false;
            }
            this.handleChange();
        },
        delRow(row) {
            let idx = this.selectedRows.findIndex((item) => item.user_id === row.user_id);
            // console.log(idx)
            if (idx >= 0) {
                //存在则删除
                this.selectedRows.splice(idx, 1);
                this.handleChange();
            }
        },
        handleCurrentChange(val) {
            this.currentPage = val;
            this.GetUserData();
        },
        clearSelected() {
            this.selectedRows = [];
            this.handleChange();
        },
        handleChange() {
            if (this.multiple) {
                //
                this.valueData = this.selectedRows.map((row) => String(row.user_id));
            } else {
                if (this.selectedRows.length) {
                    this.valueData = String(this.selectedRows[0].user_id);
                }
            }
            // console.log(this.valueData)
            this.$emit('change', this.valueData);
        },
        tableRowClassName({ row, rowIndex }) {
            let idx = this.selectedRows.findIndex((item) => item.user_id === row.user_id);
            if (idx >= 0) {
                return 'success-row';
            }
            return '';
        }
    }
};
</script>
<style>
.el-table .success-row {
    background: #f0f9eb;
}
</style>
```

:::
