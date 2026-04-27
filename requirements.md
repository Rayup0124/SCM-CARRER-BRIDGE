# SCM Career Bridge - 需求与进度追踪 (FYP 1)

**项目描述:** 一个专为 UTS 计算与创意媒体学院 (SCM) 设计的中心化实习平台。该平台旨在解决学生寻找实习信息碎片化、教职员难以追踪学生实习状态以及行业技能需求不明确的核心痛点。

**AI协作指南 (给Cursor):**
你好，Cursor！这是我们 SCM Career Bridge 项目 **FYP 1 阶段**的核心需求与开发蓝图。
-   **本阶段核心目标：完成所有后端API的开发与测试，并完成所有前端页面的高保真原型设计 (Figma)。**
-   请严格按照下方的功能列表进行开发。所有生成的代码、变量名、注释都必须使用**英文 (English)**。
-   **每当我确认一个功能或子任务完成后，请你编辑此文档，将被标记为 `[ ]` 的条目更新为 `[x]`。**
-   **请在下方的"开发日志"中，用最新的日期记录每次完成的主要工作。**

---

## 核心功能列表 (FYP 1 Checklist)

### 阶段一：项目基础与后端API

-   [x] **项目初始化与环境配置**
    -   [x] 使用 Vite + React 初始化前端项目，并配置 Tailwind CSS 和 React Router。
    -   [x] 初始化 Node.js + Express.js 后端项目。
-   [x] **后端数据库设计 (MongoDB)**
    -   [x] 设计并创建 `Users` 集合 (学生/管理员)。关键字段: `name`, `email`, `password`, `studentId`, `programme`, `skills` (数组), `role` ('student', 'admin')。
    -   [x] 设计并创建 `Companies` 集合。关键字段: `companyName`, `hrEmail`, `password`, `description`, `status` ('Pending', 'Approved')。
    -   [x] 设计并创建 `Internships` 集合。关键字段: `title`, `description`, `skills` (数组), `companyId` (关联)。
    -   [x] 设计并创建 `Applications` 集合。关键字段: `studentId`, `internshipId`, `status` ('Pending', 'Reviewed', 'Accepted', 'Rejected')。
-   [x] **核心后端 API 开发**
    -   [x] **认证 API (`/api/auth`)**:
        -   [x] `POST /register/student`: 学生注册。
        -   [x] `POST /register/company`: 公司注册 (初始状态为 'Pending')。
        -   [x] `POST /login`: 通用登录，成功后返回 JWT。
    -   [x] **实习岗位 API (`/api/internships`)**:
        -   [x] `GET /`: 获取所有已发布的实习。
        -   [x] `POST /`: 创建新实习岗位（公司权限）。
    -   [x] **申请 API (`/api/applications`)**:
        -   [x] `POST /`: 学生提交实习申请（学生权限）。
        -   [x] `GET /student/me`: 获取当前学生的所有申请记录（学生权限）。
    -   [x] **管理员 API (`/api/admin`)**:
        -   [x] `GET /companies/pending`: 获取待审批公司列表（管理员权限）。
        -   [x] `PUT /companies/approve/:id`: 批准公司注册（管理员权限）。

### 阶段二：UI/UX 原型设计与初步集成

-   [ ] **高保真原型设计 (Figma) - (由我 Kong Hang Jun 亲自设计)**
    -   [ ] 设计 **学生界面** 的所有高保真原型 (登录页, 实习列表页, 详情页, 个人主页)。
    -   [ ] 设计 **公司界面** 的所有高保真原型 (登录页, 仪表盘, 发布实习表单, 申请者管理页)。
    -   [ ] 设计 **管理员界面** 的所有高保真原型 (登录页, 公司审批列表页)。
-   [ ] **后端功能测试 (由我 Kong Hang Jun 亲自测试)**
    -   [ ] 使用 **Postman** 对所有已开发的后端 API 端点进行功能测试，并**截图**作为 Chapter 4 的成果。
-   [ ] **初步前端-后端集成测试 (简单页面)**
    -   [x] 创建一个**极简**的 React 页面（无需美化），用于API联调。
    -   [x] 在此页面上实现**用户注册**功能，确保能成功调用 `POST /api/auth/register/student` API 并将数据显示在 MongoDB 中。
    -   [x] 在此页面上实现**获取实习列表**功能，确保能成功调用 `GET /api/internships` API 并将返回的数据显示在页面上。
    -   [ ] **截图**此测试页面的成功运行结果，作为 Chapter 4 的成果。

---

## Figma 设计大纲 (Draft by Cursor)

### 学生端
- **登录页**：双栏布局，左侧为表单与验证提示，右侧展示截止事项、热门公司与 onboarding 小贴士。
- **实习列表页**：顶部英雄区给出个性化问候与技能缺口，下方使用卡片网格 + 标签过滤器，卡片内突出技能需求与 CTA。
- **详情页**：左侧描述与技能栈，右侧侧边栏显示申请状态、导师信息、相关资源。
- **个人主页**：技能雷达 / 进度条、申请时间线、导师反馈抽屉，以及生成改进计划按钮。

### 公司端
- **登录页**：强调合规流程，包含 2FA 提示、过往岗位统计。
- **仪表盘**：Kanban 视图呈现申请阶段，侧边栏显示与 SCM 联络人的公告与下一步行动。
- **发布岗位表单**：四步骤向导（概述、技能、导师、合规），提供草稿与提交审批按钮。
- **申请者管理页**：左侧表格列出候选人，右侧反馈编辑器对齐 SCM rubrics。

### 管理员端
- **登录页**：强化安全提示，列出近期登录记录与角色选择。
- **公司审批列表页**：卡片列出待审批公司、附件清单以及快捷同意/驳回按钮，侧边栏展示审批准则与 SOP 下载入口。

---

## 开发日志 (Development Log)

### [2025-12-03]
-   **项目初始化:** 完成 monorepo 结构划分、Vite + React + Tailwind + React Router 的前端初始化，以及 Node.js + Express 的后端骨架。

### [2025-12-03]
-   **数据库设计:** 在代码中定义 `Users`, `Companies`, `Internships`, `Applications` 四个 Mongoose Schema，涵盖需求列出的关键字段。

### [2025-12-03]
-   **后端开发:** 完成 `/api/auth`, `/api/internships`, `/api/applications`, `/api/admin` 的所有规划端点，包括实习详情与更新、公司端申请列表与技能统计 API（尚待 Postman 测试与截图）。

### [2025-12-03]
-   **原型设计:** 提供学生、公司、管理员端页面布局与组件描述，为 Figma 高保真设计提供指引。