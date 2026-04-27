# SCM-CAREER-BRIDGE — User Manual

---

# PART 1: English Version

---

## 1. System Overview

SCM-Career-Bridge is an internship management platform for the SCM (School of Computer Science and Engineering / related) programme. Three user roles interact with the system:

| Role | Who | Purpose |
|---|---|---|
| **Student** | SCM programme students | Discover internships, apply, track applications, manage profile & resume |
| **Company** | HR partners / employers | Register, post internships, review and manage applicants |
| **Admin** | SCM programme leads / coordinators | Approve companies, manage announcements, oversee platform health |

---

## 2. Getting Started — Landing Page

**URL:** `/`

The landing page presents three portal cards — click **Student Portal**, **Company Portal**, or **Admin Portal** to be redirected to the respective login page.

---

## 3. Student Portal

### 3.1 Login & Registration

**URL:** `/student/login`

#### Login
- Enter your **UTS student email** (must end with `@something.[tld]`) and your **password**.
- Click **Login to portal**.
- On success you are redirected to the Student Dashboard.
- Use the **Register** tab to create a new account.

#### Registration
- Fill in: **Name**, **Programme** (dropdown of official SCM programmes), **Student ID** (prefix must match programme — BCS / BID / BDM / BMD), **Email**, **Password**, **Confirm Password**.
- Student ID prefix validation:
  - BCS → Bachelor of Computer Science
  - BID → Bachelor of Arts in Industrial Design
  - BDM → Bachelor of Arts (Hons.) in Creative Digital Media
  - BMD → Bachelor of Mobile Game Development
- After registration, switch to the **Login** tab and sign in.

---

### 3.2 Student Dashboard

**URL:** `/student/dashboard`

After login you land here. It shows:

- **Stats cards:** Total Applications, Under Review, Interviewing, Offers Received
- **My Applications:** Last 5 applications with status badge, "View details" and "Withdraw" buttons
  - Status badges: Applied (grey), Under Review (yellow), Interviewing (sky blue), Offered (green), Rejected (red)
  - Withdraw is only available for **Applied** or **Under Review** statuses
- **Quick Actions:** Browse Internships, Update Resume, Edit Profile, View Saved Internships, View Announcements
- **Skills Demand Dashboard:** Top skills employers are seeking, with career insights

---

### 3.3 Browse Internships

**URL:** `/student/internships`

Search and filter all published internships.

**Filters (left sidebar):**
- **Search Keywords:** Search by title, company name, or skills
- **Your Programme:** Filter by your programme (multi-select checkboxes)
- **Desired Skills:** Filter by skill tags (multi-select checkboxes)
- **Clear All Filters** button resets all selections

**Sort:** Dropdown (Most Recent / Most Applicants / Deadline)

**Each internship card shows:**
- Title, company name, location, posted date, duration
- Skill tags (sky blue pills)
- Target programme tags (purple pills)
- Buttons: **Details**, **★ Saved / ☆ Save for Later**, **Apply Now / Applied**

---

### 3.4 Internship Detail

**URL:** `/student/internships/:id`

View full internship details:
- Location, duration, posted date
- Description
- Skills required
- Target programmes
- Required documents list (amber pills)
- Buttons: **Browse more internships**, **Apply Now**, **★ Saved / ☆ Save for Later**
- If already applied: **✓ Already Applied** (disabled button)

---

### 3.5 Apply for Internship

**URL:** `/student/internships/:id/apply`

Three-step flow:

**Step 1 — Required Documents Checklist**
- Shows which documents are required for this internship (Resume, Portfolio, Transcript, Cover Letter, Certifications, Other)
- Upload each required document type individually: click **+ Add files**, select a file, type the document name, click **✕** to remove a row if needed, then click **Upload**
- All required documents must be uploaded before proceeding to Step 2

**Step 2 — Application Submission**
- Review the checklist — all required documents must show green upload confirmations
- Click **Submit Application**
- On success: green success banner, redirect to Applications page after 1.5 seconds

**Step 3 — Submitted** (after submission)
- Shows submitted documents
- Button: **Submit Final Application** (only enabled when all required docs are uploaded)
- **Withdraw** available while status is Applied or Under Review

> **Tip:** You can upload supporting documents (not required by the listing) in the "Additional Documents" section below the main form.

---

### 3.6 My Applications

**URL:** `/student/applications`

- Lists all internships you have applied for
- Each card shows: internship title, company, location, applied date, status badge
- Buttons per card: **View details**, **Withdraw** (only for Applied / Under Review)
- Empty state: "You have not applied to any internships yet" with a link to Browse Internships

---

### 3.7 Saved Internships

**URL:** `/student/favorites`

- Lists internships saved with the ★ button
- Each card: same info as browse listing
- Buttons: **Details**, **Apply Now**, **Remove** (removes from saved list)
- Empty state: "No saved internships yet" with a link to Browse Internships

---

### 3.8 Edit Profile

**URL:** `/student/profile`

**Account Information (read-only):**
- Student ID, Email

**Personal Information (editable):**
- **Full Name** — required
- **Programme / Major** — dropdown, must select from official list
- **Skills** — click suggested skill pills to add; type custom skills and press Enter or comma; click × on a tag to remove

**Resume:**
- Section anchor: `#resume`
- Click **Choose file** to select PDF or image (JPEG, PNG, WebP, GIF), max 5MB per file, up to 10 files
- Click **Upload N file(s)** to save to server
- View uploaded resumes: click filename to open in new tab
- Remove uploaded resume: click × next to the file
- Add more files: click **+ Add more**

---

### 3.9 Announcements

**URL:** `/student/announcements`

- Lists all system-wide announcements posted by admin
- Each announcement shows: violet badge "Announcement", title, posted by name, date, content
- Attachments (if any): click to open in new tab
- Empty state: "No announcements at this time"

---

### 3.10 Skills Analytics

**URL:** `/student/skills-analytics`

- **Filter by your programme** toggle — show skills only from internships targeting your programme
- Stats cards: Distinct skills count, Total skill mentions, Top skill, 2nd skill, 3rd skill
- **Smart Suggestions:** AI-generated tips based on your profile vs market demand
- **Your profile vs top demand:** Shows overlap (green pills = you have it) and gaps (popular skills you haven't listed)
- **Full ranking:** Horizontal bar chart of all skills in published internships, sorted by frequency
- Link to **Browse internships** and **Dashboard**

---

## 4. Company Portal

### 4.1 Login & Registration

**URL:** `/company/login`

#### Login
- Enter **HR Email** and **Password**
- Click **Login to portal**
- On success redirected to Company Dashboard
- Company account must be **Approved** by admin before posting is allowed

#### Registration
- Fill in: **Company Name**, **HR Email**, **Company Description**, upload **Verification documents** (SSM certificate, business registration, etc.) — optional but recommended
- Click **Register company**
- After registration, use the **Login** tab to sign in
- Your account will show as **Pending Review** until admin approves

#### If rejected
- Error banner will say "Your account has been rejected."
- A **Request Reactivation** button appears — click to request re-review by admin

---

### 4.2 Company Dashboard

**URL:** `/company/dashboard`

**Verification Status Banners (top of page, only if not approved):**
- **Pending Review** (blue): "Your company account is currently being reviewed..."
- **Additional Documents Required** (orange): Shows admin's request message; upload documents and click **Submit Documents**
- **Rejected** (red): Shows rejection reason; contact admin

**Key Metrics Cards:**
- Total Internships, Total Applicants, Active Positions

**Published Internships:**
- Lists all posted positions with: title, status badge (Open/Closed), applicant count, applicant breakdown by status (Applied / Under Review / Interview / Offered / Rejected)
- Per position: **View Applicants**, **Edit Position**, **Close Position / Reopen Position**, **Delete** (with confirmation)
- If no internships posted: **+ Post New Internship** button

**Drafts Section (amber):**
- Drafts saved but not published; click **Edit & Publish** or **Delete**

---

### 4.3 Post New Internship

**URL:** `/company/internships/new`

> Only available when your company account is **Approved**.

Three-step guided form:

**Step 1 — Overview**
- Internship Title (required)
- Description (required, textarea)
- Location (required)
- Duration (required)
- Click **Next**

**Step 2 — Skills & Toolkit**
- Required skills: click suggested pills to add; type custom skills, press Enter or comma, click × to remove
- Target programmes: checkboxes for 4 SCM programmes (at least one recommended)
- Click **Next** or **Save Draft**

**Step 3 — Required Documents**
- Select which document types applicants must submit: Resume, Portfolio, Transcript, Cover Letter, Certifications, Other
- Leave all unchecked if no specific documents are required
- Selected types shown as summary pills
- Click **Submit internship** to publish, or **Save Draft** to save without publishing

---

### 4.4 Edit Internship

**URL:** `/company/internships/:id/edit`

- Edit title, description, location, duration, skills, target programmes
- For published positions: **Save Changes**
- For drafts: **Publish** (to make live) or **Save & Stay Draft**
- Changing skills/description updates what students see immediately

---

### 4.5 Applicant Management

**URL:** `/company/applicants`

**Filters (top):**
- Dropdown: All positions or specific internship
- Dropdown: All Statuses / Applied / Under Review / Interviewing / Offered / Rejected

**Status Summary Cards:** Total, Applied, Under Review, Interviewing, Offered, Rejected

**Each applicant card shows:**
- Student name, initials avatar, email, programme
- Status badge
- Note indicator (📝 Note) if a note exists
- Skills tags
- Note content (if any)

**Actions per applicant:**
- **View Full Profile:** Opens a modal with name, email, programme, skills
- **Open Resume / Resume 1, 2, ...:** Opens student's uploaded resume(s) in new tab; button disabled if no resume
- **Submitted Docs:** Buttons showing document type names — click to open in new tab
- **Send Email:** Opens Gmail compose window
- **Status dropdown:** Change to Applied / Under Review / Interviewing / Offered / Rejected
- **Add Note / Edit Note:** Opens inline note modal; notes are private (only company sees them)

---

### 4.6 Company Profile

**URL:** `/company/profile`

**Company Information:**
- Edit **Company Name**, **Website**, **About Company**
- Click **Edit** → make changes → **Save Changes**
- **Cancel** to discard changes

**Verification Documents:**
- Shows already-uploaded documents
- **Choose file / Add more** to upload PDF or image, max 5MB, up to 10 files
- Click **Upload N document(s)** to save

---

## 5. Admin Portal

### 5.1 Login

**URL:** `/admin/login`

- Enter **Admin Email** and **Password**
- Click **Login to admin panel**
- On success redirected to Admin Overview

---

### 5.2 Admin Overview (Dashboard)

**URL:** `/admin/overview`

**KPI Cards:** Students, Companies, Internships, Applications

**Charts:**
- Applications by Status (bar chart + horizontal bar breakdown)
- Company Overview (Total / Approved / Pending bar chart)

**Platform Summary Table:** Registered Students, Registered Companies, Approved Companies, Pending Approval, Open Internships, Total Applications

**Skills Analytics:**
- Stats: Distinct skills, Total mentions, Top 3 skills
- Top 15 Skills bar chart (vertical)
- Top 15 Skills breakdown (horizontal bars)

---

### 5.3 Company Approvals

**URL:** `/admin/approvals`

**Filters:** All Pending / Awaiting Review / Awaiting Docs

Lists companies pending approval. Each card shows:
- Status badge
- Company name, description, HR email, website, registration date
- Uploaded verification documents — click to open

**Actions per company:**
- **Approve** (green): Grants company access to post internships
- **Reject** (opens modal): Enter optional rejection reason, then **Confirm Reject**
- **Request Documents** (orange): Opens modal to type a message; company receives notification and their status changes to Awaiting Documents
- **Send Email**: Opens Gmail compose to HR email

---

### 5.4 All Companies

**URL:** `/admin/companies`

**Filters:** Search by name or email, Status dropdown (All / Approved / Pending Review / Awaiting Docs / Rejected)

**Summary Cards:** Total, Approved, Pending Review, Awaiting Docs, Rejected

**Per company:**
- Company name, status badge, description
- HR Email, Website, Registration date
- **Send Email** button

**Per status:**
- **Approved companies:** Request Docs (opens prompt for message)
- **Rejected companies:** Reactivate, Send Email
- **Pending companies:** Approve, Reject (with optional reason prompt), Request Docs, Send Email

---

### 5.5 All Students

**URL:** `/admin/students`

**Filters:** Search by name, email, or student ID; Programme dropdown

**Summary Cards:** Total Students, Number of Programmes, Students with Resume

**Per student card:**
- Initials avatar, name, Student badge
- Email, Student ID, Programme, Registration date
- Skills tags
- **Send Email** button (opens Gmail)

---

### 5.6 Internship Management

**URL:** `/admin/internships`

**Filters:** Search by title/company/location/skill; Status (All / Open / Closed); Company dropdown

**Summary Cards:** Total Listings, Open, Closed, Total Applications

**Per internship card:**
- Title, status badge (Open/Closed), Unpublished label, Approved Co. / Pending Co. label
- Company, location, duration
- Description (truncated)
- Skills tags
- Posted date, applicant count, breakdown by status
- **Close / Reopen** toggle button
- **Delete** (with confirmation)

---

### 5.7 Application Management

**URL:** `/admin/applications`

**Status Filter Cards (clickable):** Total, Applied, Under Review, Interviewing, Offered, Rejected — click to toggle filter, click again to reset

**Filters:** Search (student name/email, internship title, company name); Company dropdown

**Table columns:** Student, Email, Internship, Company, Applied date, Status, Action

**Per row:**
- **Send Email** button (mailto link)
- **Change Status** dropdown: select new status to update

---

### 5.8 Manage Announcements

**URL:** `/admin/announcements`

**Post New Announcement:**
- Click **+ Post New** (button toggles to Cancel when form is open)
- Fill in: Posted By, Title, Content
- Attachments: click **+ Add PDF or Image** (up to 5 files, max 5MB each, PDF or image)
- **Post Announcement**

**Existing Announcements:**
- Each card shows title, posted by, date, content, attachments
- **Edit:** Inline edit form — change Posted By, Title, Content, add/remove attachments; **Save Changes** or **Cancel**
- **Delete:** With confirmation prompt

---

## 6. Common Tasks Reference

### 6.1 Student: Apply for an Internship
1. Browse internships → `/student/internships`
2. Click **Details** on any listing
3. Click **Apply Now**
4. Upload required documents one by one in the checklist
5. Submit application
6. Track status in My Applications → `/student/applications`

### 6.2 Student: Build Your Profile
1. Go to Edit Profile → `/student/profile`
2. Fill in Name, Programme
3. Add skills (suggested pills or type custom)
4. Upload resume(s) — students with resumes get more attention from companies
5. Save Changes

### 6.3 Company: Post an Internship
1. Wait for account approval (green banner disappears)
2. Go to Dashboard → `/company/dashboard`
3. Click **+ Post New Internship**
4. Fill 3-step form: Overview → Skills & Toolkit → Required Documents
5. Submit or Save as Draft
6. View applicants at `/company/applicants`

### 6.4 Admin: Approve a Company
1. Go to Company Approvals → `/admin/approvals`
2. Review company details and uploaded documents
3. Click **Approve** (green button)
4. Company receives access and can post internships

### 6.5 Admin: Post an Announcement
1. Go to Manage Announcements → `/admin/announcements`
2. Click **+ Post New**
3. Fill in title, content, optionally attach files
4. Click **Post Announcement**
5. Students and companies will see it immediately on their Announcements page

---

## 7. FAQ

**Q: Student cannot apply — button is disabled**
A: Ensure you are logged in. If the internship requires documents, upload all required document types first.

**Q: Company cannot post internships**
A: Your account must be approved by admin first. Check the blue banner on the dashboard. If it says "Additional Documents Required," upload the requested documents.

**Q: Applied internship does not appear in My Applications**
A: Check the application status. If it shows "Applied" you have submitted successfully. Try refreshing the page. If still missing, contact admin.

**Q: Withdraw button is greyed out**
A: Withdraw is only available when the application status is "Applied" or "Under Review." Once status changes to Interviewing, Offered, or Rejected, withdrawal is disabled.

**Q: Company applicant list is empty**
A: No students have applied yet. Wait for applications or verify your internship is published (not a draft) and marked "Open."

**Q: How does the skills matching work?**
A: Companies tag internships with required skills. Your profile skills are compared against those tags. On the Skills Analytics page you can see which skills are most in-demand and which ones from your profile overlap or are missing.

---

---

# PART 2: 中文版本

---

## 一、系统概述

SCM-Career-Bridge 是一个实习管理平台，面向 SCM（计算机科学与工程学院/相关专业）项目。系统有三个用户角色：

| 角色 | 对象 | 功能 |
|---|---|---|
| **学生（Student）** | SCM 项目学生 | 浏览实习、申请、跟踪申请状态、管理个人资料和简历 |
| **企业（Company）** | HR 合作伙伴/雇主 | 注册、发布实习、审核和管理申请人 |
| **管理员（Admin）** | 项目负责人/协调员 | 审批企业、管理公告、监控平台运行状况 |

---

## 二、首页

**网址：** `/`

首页展示三个门户卡片 — 点击 **Student Portal**、**Company Portal** 或 **Admin Portal** 跳转到相应登录页面。

---

## 三、学生门户

### 3.1 登录与注册

**网址：** `/student/login`

#### 登录
- 输入 **UTS 学生邮箱**（必须以 `@something.[域名]` 结尾）和 **密码**
- 点击 **Login to portal**
- 成功后跳转到学生仪表板
- 点击 **Register** 标签页可创建新账号

#### 注册
- 填写：**姓名**、**专业**（下拉选择 SCM 官方专业列表）、**学号**（前缀必须与专业匹配 — BCS / BID / BDM / BMD）、**邮箱**、**密码**、**确认密码**
- 学号前缀对应关系：
  - BCS → Bachelor of Computer Science
  - BID → Bachelor of Arts in Industrial Design
  - BDM → Bachelor of Arts (Hons.) in Creative Digital Media
  - BMD → Bachelor of Mobile Game Development
- 注册完成后切换到 **Login** 标签页登录

---

### 3.2 学生仪表板

**网址：** `/student/dashboard`

登录后默认显示：
- **统计卡片：** 总申请数、审核中、面试中、已获录取
- **我的申请：** 最近 5 条申请，含状态标签、"查看详情"和"撤回"按钮
  - 状态标签：Applied（灰）、Under Review（黄）、Interviewing（天蓝）、Offered（绿）、Rejected（红）
  - 撤回按钮仅在状态为 **Applied** 或 **Under Review** 时可用
- **快捷操作：** 浏览实习、更新简历、编辑资料、保存的实习、查看公告
- **技能需求看板：** 雇主最需求的技能排行榜及职业洞察

---

### 3.3 浏览实习

**网址：** `/student/internships`

搜索和筛选所有已发布的实习职位。

**筛选器（左侧栏）：**
- **搜索关键词：** 按标题、公司名或技能搜索
- **你的专业：** 按专业筛选（多选复选框）
- **期望技能：** 按技能标签筛选（多选复选框）
- **清除全部筛选** 按钮重置所有选项

**排序：** 下拉菜单（最新 / 申请最多 / 截止日期）

**每个实习卡片显示：**
- 标题、公司名、地点、发布日期、时长
- 技能标签（天蓝色标签）
- 目标专业标签（紫色标签）
- 按钮：**详情**、**★ 已收藏 / ☆ 收藏**、**立即申请 / 已申请**

---

### 3.4 实习详情

**网址：** `/student/internships/:id`

查看完整实习信息：
- 地点、时长、发布日期
- 职位描述
- 所需技能
- 目标专业
- 所需材料清单（琥珀色标签）
- 按钮：**浏览更多实习**、**立即申请**、**★ 已收藏 / ☆ 收藏**
- 若已申请：显示 **✓ 已申请**（灰色禁用按钮）

---

### 3.5 申请实习

**网址：** `/student/internships/:id/apply`

三步流程：

**第一步 — 所需材料清单**
- 显示该实习要求提交的材料类型（简历、作品集、成绩单、求职信、证书、其他）
- 逐一上传每种所需材料：点击 **+ 添加文件**，选择文件，输入材料名称，点击 **✕** 可移除该行，点击 **上传**
- 必须上传全部所需材料后才能进入第二步

**第二步 — 提交申请**
- 确认清单 — 全部所需材料须显示绿色上传确认
- 点击 **提交申请**
- 成功后显示绿色成功提示，1.5 秒后跳转到"我的申请"页面

**第三步 — 已提交**（提交后）
- 显示已提交的申请材料
- **提交最终申请** 按钮（仅在全部所需材料上传后可用）
- 在状态为 Applied 或 Under Review 时可撤回

> **提示：** 可在主表单下方的"附加材料"区域上传 listing 中未要求的支持性文件。

---

### 3.6 我的申请

**网址：** `/student/applications`

- 列出所有已申请的实习
- 每条卡片显示：实习标题、公司、地点、申请日期、状态标签
- 每条按钮：**查看详情**、**撤回**（仅在 Applied / Under Review 状态下可用）
- 空状态："你还没有申请任何实习"并附有"浏览实习"链接

---

### 3.7 保存的实习

**网址：** `/student/favorites`

- 列出以 ★ 按钮收藏的实习
- 每条卡片：与浏览列表相同的实习信息
- 按钮：**详情**、**立即申请**、**移除**（从收藏列表中移除）
- 空状态："暂无收藏的实习"并附有"浏览实习"链接

---

### 3.8 编辑个人资料

**网址：** `/student/profile`

**账户信息（只读）：**
- 学号、邮箱

**个人信息（可编辑）：**
- **姓名** — 必填
- **专业** — 下拉选择，必须从官方列表中选择
- **技能** — 点击建议技能标签添加；输入自定义技能按回车或逗号添加；点击 × 移除标签

**简历：**
- 锚点：`#resume`
- 点击 **选择文件** 选 PDF 或图片（JPEG、PNG、WebP、GIF），每个最大 5MB，最多 10 个文件
- 点击 **上传 N 个文件** 保存到服务器
- 查看已上传简历：点击文件名在新标签页打开
- 移除已上传简历：点击文件旁边的 ×
- 添加更多：点击 **+ 添加更多**

---

### 3.9 公告

**网址：** `/student/announcements`

- 列出管理员发布的系统公告
- 每条公告显示：紫色标签"公告"、标题、发布者、日期、正文
- 附件（如有）：点击在新标签页打开
- 空状态："暂无公告"

---

### 3.10 技能分析

**网址：** `/student/skills-analytics`

- **按专业筛选** 开关 — 仅显示针对你专业的实习中的技能
- 统计卡片：不同技能数量、技能总提及次数、第一/第二/第三热门技能
- **智能建议：** 根据你的资料与市场需求对比生成的建议
- **你的资料 vs 热门需求：** 交集（绿色标签 = 已具备）和缺口（你未列出的热门技能）
- **完整排名：** 所有已发布实习中的技能水平条形图，按频率排序
- 可跳转：**浏览实习** 和 **仪表板**

---

## 四、企业门户

### 4.1 登录与注册

**网址：** `/company/login`

#### 登录
- 输入 **HR 邮箱**和**密码**
- 点击 **Login to portal**
- 成功后跳转到企业仪表板
- 企业账号须经管理员 **审批通过** 后才能发布实习

#### 注册
- 填写：**公司名称**、**HR 邮箱**、**公司简介**，上传**验证文件**（SSM 证书、商业登记证等）— 可选但建议上传
- 点击 **Register company**
- 注册后使用 **Login** 标签页登录
- 账号将显示为 **Pending Review** 直到管理员审批

#### 如被拒绝
- 错误提示："Your account has been rejected."
- 出现 **Request Reactivation** 按钮 — 点击向管理员申请重新审核

---

### 4.2 企业仪表板

**网址：** `/company/dashboard`

**认证状态横幅（顶部，仅在未审批时显示）：**
- **Pending Review**（蓝）："你的企业账号正在审核中..."
- **Additional Documents Required**（橙）：显示管理员请求的消息；上传文件后点击 **提交文件**
- **Rejected**（红）：显示拒绝原因；请联系管理员

**关键指标卡片：** 总实习数、申请人数、活跃职位数

**已发布的实习列表：**
- 每条职位显示：标题、状态标签（开放/关闭）、申请人数、按状态分布（已申请/审核中/面试/录用/拒绝）
- 每条操作：**查看申请人**、**编辑职位**、**关闭职位/重新开放**、**删除**（需确认）
- 若无实习：显示 **+ 发布新实习** 按钮

**草稿区（琥珀色）：**
- 保存但未发布的草稿；点击 **编辑并发布** 或 **删除**

---

### 4.3 发布新实习

**网址：** `/company/internships/new`

> 仅在企业账号 **审批通过** 后可用。

三步引导表单：

**第一步 — 概览**
- 实习标题（必填）
- 描述（必填，文本框）
- 工作地点（必填）
- 实习时长（必填）
- 点击 **下一步**

**第二步 — 技能与工具**
- 所需技能：点击建议标签添加；输入自定义技能，按回车或逗号添加，点击 × 移除
- 目标专业：4 个 SCM 专业的复选框（建议至少选一个）
- 点击 **下一步** 或 **保存草稿**

**第三步 — 所需材料**
- 选择申请人须提交的文档类型：简历、作品集、成绩单、求职信、证书、其他
- 若无特定要求可不选
- 所选类型以标签汇总显示
- 点击 **提交实习** 发布，或 **保存草稿** 不发布

---

### 4.4 编辑实习

**网址：** `/company/internships/:id/edit`

- 编辑标题、描述、地点、时长、技能、目标专业
- 已发布职位：**保存更改**
- 草稿职位：**发布**（使其上线）或 **保存并保持草稿**
- 修改技能/描述后学生端立即可见

---

### 4.5 申请人管理

**网址：** `/company/applicants`

**筛选器（顶部）：**
- 下拉框：所有职位或指定实习
- 下拉框：全部状态 / 已申请 / 审核中 / 面试中 / 已录用 / 已拒绝

**状态汇总卡片：** 总数、已申请、审核中、面试中、已录用、已拒绝

**每位申请人卡片显示：**
- 姓名、头像缩写、邮箱、专业
- 状态标签
- 备注指示器（📝 备注）若已有备注
- 技能标签
- 备注内容（如有）

**每位申请人操作：**
- **查看完整资料：** 弹出框显示姓名、邮箱、专业、技能
- **打开简历 / 简历 1, 2, ...：** 在新标签页打开学生上传的简历；无简历则按钮禁用
- **已提交材料：** 显示文档类型名称的按钮 — 点击在新标签页打开
- **发送邮件：** 打开 Gmail 撰写窗口
- **状态下拉框：** 改为已申请 / 审核中 / 面试中 / 已录用 / 已拒绝
- **添加备注 / 编辑备注：** 打开备注弹窗；备注仅企业可见

---

### 4.6 企业资料

**网址：** `/company/profile`

**企业信息：**
- 编辑 **公司名称**、**网站**、**公司简介**
- 点击 **编辑** → 修改 → **保存更改**
- **取消** 放弃更改

**验证文件：**
- 显示已上传文件
- **选择文件 / 添加更多** 上传 PDF 或图片，每个最大 5MB，最多 10 个文件
- 点击 **上传 N 个文档** 保存

---

## 五、管理员门户

### 5.1 登录

**网址：** `/admin/login`

- 输入 **管理员邮箱**和**密码**
- 点击 **Login to admin panel**
- 成功后跳转到管理员总览

---

### 5.2 管理员总览（仪表板）

**网址：** `/admin/overview`

**KPI 卡片：** 学生数、企业数、实习数、申请数

**图表：**
- 按状态统计申请数（柱状图 + 水平条明细）
- 企业概览（总数/已审批/待审核 柱状图）

**平台汇总表：** 注册学生数、注册企业数、已审批企业、待审批、开放实习数、申请总数

**技能分析：**
- 统计：不同技能数、总提及次数、前三热门技能
- 前 15 技能柱状图（垂直）
- 前 15 技能明细（水平条）

---

### 5.3 企业审批

**网址：** `/admin/approvals`

**筛选：** 全部待审 / 待审核 / 等待材料

列出待审批企业。每条卡片显示：
- 状态标签
- 公司名、简介、HR 邮箱、网站、注册日期
- 已上传验证文件 — 点击打开查看

**每家企业操作：**
- **批准**（绿）：授予企业发布实习权限
- **拒绝**（弹出弹窗）：输入可选拒绝原因，确认拒绝
- **请求材料**（橙）：弹出弹窗输入消息；企业收到通知，状态变为"等待材料"
- **发送邮件：** 打开 Gmail 撰写窗口到 HR 邮箱

---

### 5.4 所有企业

**网址：** `/admin/companies`

**筛选：** 按名称或邮箱搜索；状态筛选（全部/已批准/待审核/等待材料/已拒绝）

**汇总卡片：** 总数、已批准、待审核、等待材料、已拒绝

**每家企业：**
- 公司名、状态标签、简介
- HR 邮箱、网站、注册日期
- **发送邮件** 按钮

**按状态操作：**
- **已批准企业：** 请求材料（弹出输入消息）
- **已拒绝企业：** 重新激活、发送邮件
- **待审企业：** 批准、拒绝（可选原因）、请求材料、发送邮件

---

### 5.5 所有学生

**网址：** `/admin/students`

**筛选：** 按姓名、邮箱或学号搜索；专业筛选

**汇总卡片：** 学生总数、专业数量、有简历的学生数

**每位学生卡片：**
- 头像缩写、姓名、学生标签
- 邮箱、学号、专业、注册日期
- 技能标签
- **发送邮件** 按钮（打开 Gmail）

---

### 5.6 实习管理

**网址：** `/admin/internships`

**筛选：** 按标题/企业/地点/技能搜索；状态（全部/开放/关闭）；企业筛选

**汇总卡片：** 实习总数、开放、关闭、申请总数

**每条实习卡片：**
- 标题、状态标签（开放/关闭）、未发布标签、已审批企业/待审企业标签
- 企业、地点、时长
- 描述（截断显示）
- 技能标签
- 发布日期、申请人数、按状态分布
- **关闭/重新开放** 切换按钮
- **删除**（需确认）

---

### 5.7 申请管理

**网址：** `/admin/applications`

**状态筛选卡片（可点击）：** 总数、已申请、审核中、面试中、已录用、已拒绝 — 点击切换筛选，再次点击重置

**筛选：** 搜索（学生姓名/邮箱、实习标题、企业名）；企业筛选

**表格列：** 学生、邮箱、实习、企业、申请日期、状态、操作

**每行操作：**
- **发送邮件** 按钮（mailto 链接）
- **更改状态** 下拉框：选择新状态更新

---

### 5.8 管理公告

**网址：** `/admin/announcements`

**发布新公告：**
- 点击 **+ 发布新公告**（表单打开后按钮变为"取消"）
- 填写：**发布者**、**标题**、**内容**
- 附件：点击 **+ 添加 PDF 或图片**（最多 5 个文件，每个最大 5MB，仅 PDF 或图片）
- 点击 **发布公告**

**已有公告：**
- 每条卡片显示标题、发布者、日期、内容、附件
- **编辑：** 行内编辑表单 — 修改发布者、标题、内容、添加/移除附件；**保存更改** 或 **取消**
- **删除：** 需确认提示

---

## 六、常见任务参考

### 学生：申请实习流程
1. 浏览实习 → `/student/internships`
2. 点击任意实习的 **详情**
3. 点击 **立即申请**
4. 在材料清单中逐一上传所需材料
5. 提交申请
6. 在"我的申请" → `/student/applications` 中跟踪状态

### 学生：完善个人资料
1. 进入编辑资料 → `/student/profile`
2. 填写姓名、专业
3. 添加技能（建议标签或自定义）
4. 上传简历 — 有简历的学生更容易获得企业关注
5. 保存更改

### 企业：发布实习
1. 等待账号审批通过（绿色横幅消失）
2. 进入仪表板 → `/company/dashboard`
3. 点击 **+ 发布新实习**
4. 填写三步表单：概览 → 技能与工具 → 所需材料
5. 提交或保存为草稿
6. 在 `/company/applicants` 查看申请人

### 管理员：审批企业
1. 进入企业审批 → `/admin/approvals`
2. 审核企业资料和上传文件
3. 点击 **批准**（绿色按钮）
4. 企业获得权限，可以发布实习

### 管理员：发布公告
1. 进入管理公告 → `/admin/announcements`
2. 点击 **+ 发布新公告**
3. 填写标题、内容、可选附件
4. 点击 **发布公告**
5. 学生和企业立即在其公告页面看到

---

## 七、常见问题

**问：学生无法申请 — 按钮被禁用**
答：确认已登录。如果实习要求材料，请先上传全部所需材料类型。

**问：企业无法发布实习**
答：企业账号必须先经管理员审批。看仪表板上的蓝色横幅。如果显示"需要额外材料"，请上传要求的文件。

**问：已申请的实习没有出现在"我的申请"中**
答：检查申请状态。如果显示"已申请"则提交成功。尝试刷新页面。如仍缺失请联系管理员。

**问：撤回按钮是灰色的**
答：撤回仅在申请状态为"已申请"或"审核中"时可用。一旦状态变为面试中、已录用或已拒绝，则无法撤回。

**问：企业申请人列表为空**
答：暂无学生申请。等待申请，或确认你的实习已发布（非草稿）且状态为"开放"。

**问：技能匹配是如何工作的？**
答：企业在发布实习时标记所需技能。你的资料中的技能与这些标签进行对比。在技能分析页面你可以看到哪些技能最热门，哪些技能与你的资料匹配或缺失。
