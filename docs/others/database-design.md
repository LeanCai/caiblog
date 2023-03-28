# 表设计

### 表设计

| 字段            | 类型         | 空  | 默认 | 注释                                    |
| :-------------- | :----------- | :-- | ---- | --------------------------------------- |
| id              | int(11)      | 否  |      |                                         |
| tenant_id       | int(11)      | 否  |      | 租户 ID                                 |
| village_id      | INT(11)      | 否  |      | 乡村标识                                |
| name            | varchar(50)  | 否  |      | 姓名                                    |
| student_img     | varchar(100) | 否  |      | 照片链接                                |
| sex             | int(11)      | 否  |      | 性别                                    |
| birthday        | datetime     | 否  |      | 出生年月日                              |
| college         | varchar(50)  | 否  |      | 毕业大学                                |
| graduation_time | datetime     | 否  |      | 毕业时间                                |
| education       | int(11)      | 否  |      | 学历,1：专科，2：本科，3：硕士，4：博士 |
| support_count   | int(11)      | 是  | 0    | 支持数量                                |
| createid        | INT(11)      | 否  |      | 创建人                                  |
| creator         | VARCHAR(100) | 否  |      | 创建人                                  |
| createdate      | datetime     | 否  |      | 创建时间                                |
| modifyid        | INT(11)      | 否  |      | 修改人                                  |
| modifier        | VARCHAR(100) | 否  |      | 修改人                                  |
| modifydate      | datetime     | 否  |      | 修改时间                                |

- 备注：无

### sql

```sql
CREATE TABLE `lc_college_student` (
`id`  int(11) NOT NULL AUTO_INCREMENT COMMENT '大学生录主键' ,
`tenant_id`  int(11) NULL COMMENT '租户ID' ,
`village_id`  int(11) NULL COMMENT '村庄ID' ,
`name`  varchar(100) NULL COMMENT '姓名' ,
`student_img`  varchar(100) NULL COMMENT '照片链接' ,
`sex`  int(11) NULL COMMENT '性别，0：女，1：男' ,
`birthday`  datetime NULL COMMENT '出生日期' ,
`college`  varchar(100) NULL COMMENT '毕业大学' ,
`graduation_time`  datetime NULL COMMENT '毕业时间' ,
`education`  int NULL COMMENT '学历,1：专科，2：本科，3：硕士，4：博士' ,
`support_count`  int(11) NOT NULL DEFAULT '0' COMMENT '支持数量' ,
`createid`  int(11) NULL COMMENT '创建人' ,
`creator`  varchar(100) NULL COMMENT '创建人' ,
`createdate`  datetime NULL COMMENT '创建时间' ,
`modifyid`  int(11) NULL COMMENT '修改人' ,
`modifier`  varchar(100) NULL COMMENT '修改人' ,
`modifydate`  datetime NULL COMMENT '修改时间' ,
PRIMARY KEY (`id`)
)
DEFAULT CHARACTER SET=utf8
COMMENT='大学生录'
;
```
