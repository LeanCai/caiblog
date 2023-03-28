module.exports = {
  base: "/CaiBlog/",
  title: "CaiBlog",
  description: 'Just playing around',
  markdown: {
    // lineNumbers: true,
    extendMarkdown: md => {
      md.use(require("markdown-it-disable-url-encode"));
    }
  },
  themeConfig: {
    nav: [
      { text: "项目介绍", link: "/project/" },
      { text: "杂记", link: "/others/" }, // 内部链接 以docs为根目录
      { text: "关于", link: "/home/" }, // 内部链接 以docs为根目录
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
    ],
    sidebar: {
      "/project/": [
        {
          title: "项目介绍", // 必要的
          path: "/project/", // 可选的, 标题的跳转链接，应为绝对路径且必须存在
          collapsable: false,
          children: [
            {
              title: "导航",
              path: "/project/",
            },
            {
              title: "通用后台MVC版本",
              path: "/project/admin_web_mvc",
            },
            {
              title: "通用后台前后端分离版本",
              path: "/project/admin_web_furion",
            },
          ],
        },
      ],
      "/others/": [
        {
          title: "杂记", // 必要的
          path: "/others/", // 可选的, 标题的跳转链接，应为绝对路径且必须存在
          collapsable: false,
          children: [
            {
              title: "导航",
              path: "/others/",
            },
            {
              title: "数据库设计",
              path: "/others/database-design",
            },
            {
              title: "vue组件封装",
              path: "/others/vue-component-tools",
            },
            {
              title: "钉钉消息工具类封装",
              path: "/others/dingTalk-tools",
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
  plugins: [
    [
      'vuepress-plugin-image-viewer',
      {
        selector: '.theme-default-content', // 你想要的插件起作用的页面的class或id
        options: {
          excludeClass: 'no-zoom', // 带有这个className的img标签会被排除
        },
      },
    ],
  ]
};
