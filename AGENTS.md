# 原型开发说明

需要本地预览时，由 Agent 自行启动开发服务器，并在当前环境可用的浏览器中打开页面。能够自行完成时，不要让用户手动执行启动命令。

进行较大范围的视觉改动前，如果视觉来源不清晰或已经不符合当前目标，先使用 Product Design 插件的 `get-context` skill。用户给出的、可长期复用的原型设计反馈、偏好或决策，应记录在本文件中。

根据已选定的生成稿实现页面时，以该图片为布局、组件结构、信息密度、间距、颜色、字体、可见内容和视觉层级的设计基准。

应用界面代码放在 `src/` 中。Cloudflare Worker 只通过 `wrangler.jsonc` 配置；发布前运行 `npm run build`，确认 `dist/client/index.html` 和静态资源均为最新产物。

## 发版流程

- 生产发版只有一条链路：先将目标提交推送到 GitHub 的 `main` 分支，再在该提交上创建并推送 `v*` tag。tag 触发的 GitHub Action 会把这个精确提交提升到 `release` 分支；已连接的 Cloudflare Workers Builds 只构建并部署 `release`。
- 普通的 `main` push 不得发布生产环境。不要手动推送或修改 `release` 分支。
- 不要使用 OpenAI Sites，也不要新增任何 Sites 专用文件、脚本、测试或托管配置。
- 正常发版不要在本机执行 `wrangler deploy`。只有用户明确要求进行本地验证或 Cloudflare 配置操作时，才使用 Wrangler。
- 推送发版 tag 后，必须依次确认 GitHub Action、远端 `release` 提交、Cloudflare 构建以及线上站点的新资源，全部验证成功后才能报告发版完成。

## 产品决策

- 对外身份只使用 `Elin`。不要在界面文案、元数据、资源或代码注释中暴露用户真实姓名。
- 这是一个聚焦的中文单页作品集：先展示个人介绍，再展示项目墙。不要新增路由或无关板块。
- 已选定的视觉方向是连续、动态的极光与山景全景背景，搭配半透明深蓝色项目界面。
- 在“精选作品”中，Vue Form Craft 是唯一的通栏主项目，也是唯一显示 GitHub Star 数量的项目；小筑和 yl-code 使用两个同级的次要卡片。
- 点击项目卡片时，在当前页面打开详情弹窗，不跳转到项目详情路由。
- 使用真实的产品截图、预览链接和 GitHub 仓库。Vue Form Craft 链接到 `form.elin521.cn/form-design`；小筑链接到 `xiaozhu.elin521.cn`；yl-code 不提供在线预览按钮，只在详情弹窗中说明如何安装 npm 包。
- 作品墙由线上配置驱动：公开页面从 `/api/works` 读取 Cloudflare KV 中的配置，配置不存在或接口异常时回退到仓库内置默认数据。
- 管理入口固定为 `/admin`，不要在公开页面展示入口。管理密钥只能存为 Cloudflare Worker Secret，不得写入源码、配置文件或 GitHub。
- 作品图片上传到 `elin-os-media` R2 Bucket，通过 `/media/*` 读取；作品文字、链接、排序和展示状态保存在 `elin-os-works` KV Namespace。
- 主项目的 GitHub Star 在浏览器中通过 GitHub 公开仓库接口实时刷新；Worker 使用 Shields.io JSON 与 KV 缓存作为限流或网络异常时的回退，不要继续手工维护 Star 数字。
