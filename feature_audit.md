# SCM-CARRER-BRIDGE Feature Audit Report

> Generated: 2026-04-13
> Last Updated: 2026-04-13 (High/Medium priority fully completed)

---

## 1. Student View

| Route | Page | Features | Status |
|-------|------|----------|--------|
| `/student/login` | Login/Register | Register & login with `@student.uts.edu.au` email, programme match validation | ✅ Complete |
| `/student/dashboard` | Dashboard | Application stats cards, last 5 applications, withdraw (Pending/Reviewed), skills demand chart | ✅ Complete |
| `/student/internships` | Browse Roles | Keyword search, filter by programme/skill, favourite, apply, navigate to detail | ✅ Complete |
| `/student/internships/:id` | Role Detail | Full role info, apply directly, favourite/unfavourite | ✅ Complete |
| `/student/applications` | My Applications | All application statuses, withdraw | ✅ Complete |
| `/student/favorites` | Favourited Roles | Favourites list, navigate to detail, apply, remove favourite | ✅ Complete |
| `/student/profile` | Profile | Edit name/programme, manage skill tags, upload resume | ✅ Complete |
| `/student/announcements` | Announcements | View announcement body and attachments (images/PDF) | ✅ Complete |
| `/student/skills-analytics` | Skills Analytics | Top skills ranking, gap vs own skills, job-hunting suggestions | ✅ Complete |

---

## 2. Company View

| Route | Page | Features | Status |
|-------|------|----------|--------|
| `/company/login` | Login/Register | Register with verification docs upload; login checks Pending status (blocked if Pending) | ✅ Complete |
| `/company/dashboard` | Dashboard | Total roles/applicants/open roles KPIs, toggle role, delete role (confirm dialog), draft roles list | ✅ Complete |
| `/company/internships/new` | Post Role | Two-step guided form: basic info + skill selection, select target programmes, save as draft, publish | ✅ Complete |
| `/company/internships/:id/edit` | Edit Role | Modify role info, save (shows Publish button if coming from draft), delete | ✅ Complete |
| `/company/applicants` | Applicant Management | Filter by role/status, view student resumes (single/multi), update application status, view student profile (popup), add internal notes (popup), send email (mailto) | ✅ Complete |
| `/company/profile` | Company Profile | Update website/bio, upload verification docs | ✅ Complete |

### Key Mechanism — Company registration requires Admin approval

- After registration `status = 'Pending'`; cannot login
- After approval `status = 'Approved'`; then can login
- If status is changed back to `Pending`, login is rejected even if previously approved
- **Approved status is also checked before posting** — unapproved companies cannot publish roles

---

## 3. Admin View

| Route | Page | Features | Status |
|-------|------|----------|--------|
| `/admin/login` | Login | Login with Admin account | ✅ Complete |
| `/admin/overview` | Dashboard | KPI cards (4 items), applications-by-status bar chart, company overview bar chart, platform summary table, skills analytics | ✅ Complete |
| `/admin/approvals` | Company Approvals | View pending company details, Approve, Reject (delete) | ✅ Complete |
| `/admin/companies` | All Companies | View all companies, search by name/email, filter by Approved/Pending | ✅ Complete |
| `/admin/students` | All Students | View all students, search by name/email/student ID, filter by programme | ✅ Complete |
| `/admin/announcements` | Announcement Management | Post announcement (with up to 5 image/PDF attachments), edit/delete announcement | ✅ Complete |
| `/admin/internships` | Internship Management | View all roles (with applicant distribution), Close/Reopen role, Delete role (confirm) | ✅ Complete |
| `/admin/applications` | Application Management | View all applications (student/role/company/date), update application status (5 states) | ✅ Complete |

### Admin pending improvements (low priority)

- Cannot manually create/edit students (read-only)
- Cannot manually create/edit companies (read-only)
- Cannot manually create internships (can only view/close/delete)
- Announcement management API mounted under general `/announcements` route, not Admin-exclusive

---

## 4. Backend API Route Summary

### Auth (General)

| Route | Method | Controller | Role | Description |
|-------|--------|-----------|------|-------------|
| `/auth/register/student` | POST | `authController` | Public | Student registration |
| `/auth/register/company` | POST | `authController` | Public | Company registration (file upload) |
| `/auth/login` | POST | `authController` | Public | General login |

### Admin Routes

| Route | Method | Controller | Function |
|-------|--------|-----------|----------|
| `/admin/companies/pending` | GET | `getPendingCompanies` | Pending company list |
| `/admin/companies/all` | GET | `getAllCompanies` | All companies list |
| `/admin/companies/approve/:id` | PUT | `approveCompany` | Approve company |
| `/admin/companies/reject/:id` | DELETE | `rejectCompany` | Reject and delete company |
| `/admin/students/all` | GET | `getAllStudents` | All students list |
| `/admin/stats` | GET | `getStats` | Platform statistics |
| `/admin/skills/stats` | GET | `getSkillsStats` | Skills analytics data |
| `/admin/internships/all` | GET | `getAllInternships` | All internships + application stats |
| `/admin/internships/:id/status` | PUT | `updateInternshipStatusByAdmin` | Toggle Open/Closed |
| `/admin/internships/:id` | DELETE | `deleteInternshipByAdmin` | Delete internship + linked applications |
| `/admin/applications/all` | GET | `getAllApplications` | All application records |
| `/admin/applications/:id/status` | PUT | `updateApplicationStatusByAdmin` | Update application status |

### Internship Routes

| Route | Method | Controller | Role | Function |
|-------|--------|-----------|------|----------|
| `/internships` | GET | `getInternships` | Public | Browse published roles (drafts filtered) |
| `/internships/skills/stats` | GET | `getSkillsStats` | Public | Skills statistics |
| `/internships/skills/popular` | GET | `getPopularSkills` | Public | Popular skill suggestions |
| `/internships/company/me` | GET | `getCompanyInternships` | company | Company's own role list (incl. drafts) |
| `/internships/company/me/:id` | GET | `getCompanyInternshipById` | company | Company fetches single role |
| `/internships/:id` | GET | `getInternshipById` | Public | Role detail (drafts not accessible) |
| `/internships` | POST | `createInternship` | company | Publish role (supports isDraft=true) |
| `/internships/:id` | PUT | `updateInternship` | company | Edit role |
| `/internships/:id` | DELETE | `deleteInternship` | company | Delete role |

### Application Routes

| Route | Method | Controller | Role | Function |
|-------|--------|-----------|------|----------|
| `/applications` | POST | `createApplication` | student | Submit application |
| `/applications/:id` | DELETE | `withdrawApplication` | student | Withdraw application |
| `/applications/student/me` | GET | `getStudentApplications` | student | Student's application list |
| `/applications/company/me` | GET | `getCompanyAllApplications` | company | Company all applications |
| `/applications/company/:internshipId` | GET | `getCompanyApplicationsForInternship` | company | Applications by role |
| `/applications/:id/status` | PUT | `updateApplicationStatus` | company | Company updates status |
| `/applications/:id/note` | PUT | `updateApplicationNote` | company | Company adds/edits note |
| `/applications/favorites/toggle` | POST | `favoriteController` | student | Toggle favourite |
| `/applications/favorites/me` | GET | `favoriteController` | student | Get favourites list (expanded internship+company) |
| `/applications/favorites/me/ids` | GET | `favoriteController` | student | Get favourite role IDs |

### Announcement Routes

| Route | Method | Function | Notes |
|-------|--------|----------|-------|
| `/announcements` | GET | Announcement list | Student/Company/Admin shared |
| `/announcements` | POST | Post announcement | Admin |
| `/announcements/:id` | PUT | Edit announcement | Admin |
| `/announcements/:id` | DELETE | Delete announcement | Admin |
| `/announcements/:id/attachments` | DELETE | Delete single attachment | Admin |

---

## 5. Database Models

| Model | Description | Key Fields |
|-------|-------------|-----------|
| `User` | Student user | name, email, password, role, programme, skills, resumeUrl, resumeUrls |
| `Company` | Company | companyName, hrEmail, password, description, website, status, documentUrls |
| `Internship` | Internship role | title, description, location, duration, skills, targetedProgrammes, status, isPublished, **isDraft**, company |
| `Application` | Application record | student, internship, status (Pending/Reviewed/Interviewing/Accepted/Rejected), **note** |
| `Announcement` | Announcement | title, content, postedBy, attachments |
| `SkillStats` | Skill statistics | skill, count, source |
| `Favorite` | Favourite record | student, internship (composite unique index) |

---

## 6. Priority Recommendations

### High Priority (completed 2026-04-13)

1. **Student favourite feature** — New Favorite model, favoriteController with 3 endpoints, all frontend pages updated (list/detail/favourites page)
2. **Student role detail apply button** — Apply Now and favourite buttons at bottom of detail page, linked to application status
3. **Role list page button fix** — "Save for Later" changed to real favourite, "Details" changed to Link to detail page

### Medium Priority (completed 2026-04-13)

4. **Company applicants page three empty buttons** — View Full Profile popup, Add Note popup (note field added), Send Email changed to mailto link
5. **Company draft saving** — Internship isDraft field added, Save Draft works on post page, Dashboard shows drafts section separately, Edit page shows Publish button
6. **Admin Dashboard charts** — recharts installed, applications-by-status bar chart and company overview bar chart added, KPI cards expanded to 4 columns

### Low Priority (pending)

7. Manual create/edit students/companies/roles (Admin side)
8. Interview scheduling feature (Company side)
9. Email notification feature
