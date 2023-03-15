module.exports = {
  base: "/CaiBlog/",
  title: "CaiBlog",
  description: 'Just playing around',
  markdown: {
    // lineNumbers: true,
  },
  themeConfig: {
    nav: [
      {
        text: "项目介绍",
        link: "/project/",
        items: [
          {
            text: "通用后台MVC版本",
            link: "/project/admin_web_mvc",
          },
          {
            text: "通用后台前后端分离版本",
            link: "/project/admin_web_furion",
          },
        ]
      },
      // 下拉列表
      {
        text: "外部链接",
        items: [
          {
            text: "文档仓库",
            link: "https://github.com/Leancai/CaiBlog",
          },
          {
            text: "DapperBaseDal",
            link: "https://gitee.com/LeanCai/DapperBaseDal"
          },
        ],
      },
      { text: "杂记", link: "/others/" }, // 内部链接 以docs为根目录
      { text: "关于", link: "/home/" }, // 内部链接 以docs为根目录
    ],
    sidebar: {
      "/project/": [
        {
          title: "项目介绍", // 必要的
          path: "/project/", // 可选的, 标题的跳转链接，应为绝对路径且必须存在
          collapsable: false,
          children: [
            {
              title: "主要介绍",
              path: "/project/",
            },
            {
              title: "通用后台MVC版本",
              path: "/project/admin_web_mvc",
            },
            {
              title: "通用后台前后端分离",
              path: "/project/admin_web_furion",
            },
          ],
        },
      ],
      "/others/": [
        {
          title: "其他", // 必要的
          path: "/others/", // 可选的, 标题的跳转链接，应为绝对路径且必须存在
          collapsable: false,
          children: [
            {
              title: "杂记1",
              path: "/others/one",
            },
            {
              title: "杂记2",
              path: "/others/two",
            },
          ],
        },
      ],
      "/home/": [
        {
          title: "README主页", // 必要的
          path: "/home/", // 可选的, 标题的跳转链接，应为绝对路径且必须存在
          collapsable: false,
          children: [
            {
              title: "联系我",
              path: "contact",
            },
            {
              title: "关于我",
              path: "about",
            },
          ],
        },
      ],
    },
  },
};
