# Personalised Mail Campaigns
## UI & Implementation Specification

### 1. Feature Overview

Add a new **Personalised Mail / Campaigns** feature to the existing application.

The purpose of this feature is to allow a user to create a self-contained email campaign where:

1. The user creates a campaign.
2. The campaign contains a spreadsheet-like recipient/data table.
3. The user enters or imports recipient information.
4. The available table columns automatically become personalization variables.
5. The user writes an email using the existing/global mail editor.
6. Variables can be inserted directly into the email.
7. The user can preview the email for any recipient.
8. The system validates all recipients and variables.
9. The user can send or schedule the campaign.
10. Each personalized email is rendered individually and sent through the application's existing email integration.

The campaign should act as the central workspace for all of these operations.

---

# 2. Important Existing Architecture Constraint

Do not redesign or replace the existing application architecture.

This feature must be integrated into the existing application.

Reuse wherever possible:

- Existing authentication
- Existing user system
- Existing Gmail/SMTP integration
- Existing email sending service
- Existing mail editor, if available
- Existing UI components
- Existing database infrastructure
- Existing API conventions
- Existing design system
- Existing routing/navigation structure

The feature should feel like a native part of the existing application.

Do not introduce unnecessary infrastructure.

---

# 3. Primary Navigation

Add a new navigation item:

**Personalised Mail**

or, if the existing product terminology favors it:

**Campaigns**

Recommended structure:

```text
Dashboard
Mail
Personalised Mail
Settings
```

Inside Personalised Mail:

```text
Campaigns
   │
   ├── All Campaigns
   ├── Drafts
   ├── Scheduled
   ├── Sent
   └── Create Campaign
```

---

# 4. Campaign List UI

The main Campaigns page should display existing campaigns.

### Header

```text
Personalised Mail

Create and send personalised emails using campaign-specific
recipient data and reusable email templates.

[ + Create Campaign ]
```

### Campaign table/cards

Display:

```text
Campaign Name
Recipients
Status
Created
Scheduled
Last Activity
```

Example:

```text
Interview Selection - Round 1

50 recipients
Completed
Created Oct 6
Sent Oct 6

[ Open ]
```

Statuses:

```text
Draft
Ready
Scheduled
Sending
Completed
Partially Failed
Failed
Cancelled
```

---

# 5. Create Campaign

Clicking **Create Campaign** should open a simple campaign creation flow.

### Initial modal/page

```text
Create Campaign

Campaign Name
[ Interview Selection - Round 1 ]

Description (optional)
[ Optional description ]

[ Cancel ]       [ Create Campaign ]
```

After creation, immediately open the Campaign Workspace.

---

# 6. Campaign Workspace

The campaign should be treated as a self-contained workspace.

Recommended tabs:

```text
Data
Mail
Preview
Schedule
Activity
```

Optional overview section at the top.

Example:

```text
Interview Selection - Round 1

50 recipients
Draft

[ Data ] [ Mail ] [ Preview ] [ Schedule ] [ Activity ]

                                      [ Send Campaign ]
```

The campaign name and current status should always remain visible.

---

# 7. DATA TAB

The Data tab is the central spreadsheet-like interface.

The goal is to make it feel similar to a lightweight spreadsheet without requiring an actual Google Sheets integration.

Example:

```text
Data

[ Import CSV ] [ Paste Data ] [ + Add Column ] [ + Add Row ]

50 recipients

┌────────────┬──────────────────────┬───────────────┬─────────────────────┐
│ First Name │ Email                │ Interview Date│ Interview Link      │
├────────────┼──────────────────────┼───────────────┼─────────────────────┤
│ Rahul      │ rahul@gmail.com      │ 10 Oct 2026   │ https://...         │
│ Priya      │ priya@gmail.com      │ 11 Oct 2026   │ https://...         │
│ Arjun      │ arjun@gmail.com      │ 12 Oct 2026   │ https://...         │
└────────────┴──────────────────────┴───────────────┴─────────────────────┘
```

The user should be able to:

- Add rows
- Delete rows
- Edit cells
- Add columns
- Rename columns
- Delete columns
- Paste tabular data
- Import CSV
- Clear data

The application should autosave changes where appropriate.

---

# 8. Column-Based Variables

Every campaign data column should automatically become an available personalization variable.

For example:

```text
First Name
Email
Interview Date
Interview Link
Round
```

becomes:

```text
{{first_name}}
{{email}}
{{interview_date}}
{{interview_link}}
{{round}}
```

Variable keys should be generated safely from column names.

Examples:

```text
First Name        → first_name
Interview Date    → interview_date
Registration ID   → registration_id
Interview Link    → interview_link
```

The system should avoid duplicate variable keys.

If necessary, normalize column names internally while preserving the user's original display name.

---

# 9. Data Validation

The Data section should validate:

### Email

- Valid email format
- Empty email
- Duplicate email

### Required fields

The campaign must have an email/recipient field.

### Variable data

Before sending, identify missing values for variables used by the email template.

Example:

```text
Warning

The email uses:

{{interview_link}}

but 3 recipients do not have an Interview Link.

[ View affected recipients ]
```

Do not allow the campaign to send until blocking validation errors are resolved.

---

# 10. MAIL TAB

The Mail tab should use the application's existing/global email editor wherever possible.

Do not create an unrelated second email editor if an existing editor already exists.

The editor should support:

- Normal rich-text email composition
- HTML email
- Subject
- Formatting
- Links
- Images if already supported
- Attachments if already supported
- Variable insertion

Example:

```text
Mail

From
[ Existing authorized sender ▼ ]

Subject
[ Congratulations {{first_name}}! ]

┌──────────────────────────────────────────────────────────┐
│ B  I  U  Link  Image  ...  [ Insert Variable ]          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Hello {{first_name}},                                    │
│                                                          │
│ Congratulations! You have been selected for             │
│ {{round}}.                                               │
│                                                          │
│ Your interview is scheduled for {{interview_date}}.     │
│                                                          │
│ Join the interview:                                     │
│ {{interview_link}}                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

# 11. Variable Picker

The editor should have an **Insert Variable** control.

Clicking it opens:

```text
Insert Variable

Campaign Data

Search variables...

First Name
Email
Interview Date
Interview Link
Round
```

Clicking a variable inserts:

```text
{{first_name}}
```

at the current cursor position.

Users should not need to manually type variable syntax.

---

# 12. Subject Personalization

Variables should also work inside the subject.

Example:

```text
Congratulations {{first_name}}! Your interview is confirmed
```

Rahul receives:

```text
Congratulations Rahul! Your interview is confirmed
```

Priya receives:

```text
Congratulations Priya! Your interview is confirmed
```

---

# 13. PREVIEW TAB

The Preview tab should render the actual personalized email.

Provide a recipient selector:

```text
Preview as

[ Rahul ▼ ]
```

The rendered email should use the actual data belonging to that recipient.

Example:

```text
Preview

Recipient:
Rahul <rahul@gmail.com>

────────────────────────────────────────

Hello Rahul,

Congratulations! You have been selected
for Round 1.

Your interview is scheduled for
10 October 2026.

Join the interview:
[Join Interview]

────────────────────────────────────────

[ Send Test Email ]
```

Allow the user to switch recipients.

```text
[ ← Previous ]     1 / 50     [ Next → ]
```

The preview must use the same rendering engine that will be used during actual sending.

This is important. Preview and production rendering must not have separate logic.

---

# 14. Send Test Email

Provide:

**Send Test Email**

The test should send the currently rendered preview to the authenticated user's own email address or the existing configured test address.

The test should use the exact:

- Subject
- HTML
- Personalization
- Links
- Attachments

that the selected recipient would receive.

---

# 15. CAMPAIGN VALIDATION

Before allowing Send, perform a complete validation.

Validation should check:

```text
✓ Recipient data exists
✓ Email column exists
✓ Recipient count is within campaign limits
✓ Email addresses are valid
✓ No required variables are missing
✓ Template syntax is valid
✓ Subject is valid
✓ HTML can be rendered
✓ Sender configuration is valid
```

Show a clear summary:

```text
Campaign Ready

✓ 50 recipients
✓ 50 valid email addresses
✓ All variables mapped
✓ No missing values
✓ Email template valid

Ready to send.
```

If there are errors:

```text
Campaign cannot be sent

✕ 3 recipients are missing interview links
✕ 1 invalid email address

[ View Problems ]
```

---

# 16. SEND CAMPAIGN

The main action should be:

**Send Campaign**

Before sending, show a confirmation dialog.

```text
Send Campaign?

Campaign:
Interview Selection - Round 1

Recipients:
50

Sender:
yourname@organization.com

All recipients have passed validation.

[ Cancel ]       [ Send 50 Emails ]
```

The exact number should dynamically reflect the campaign.

---

# 17. Scheduling

The Schedule tab should provide:

```text
Send

○ Send immediately

○ Schedule for later

Date:
[ 10 October 2026 ]

Time:
[ 10:00 AM ]

Timezone:
[ Existing application/user timezone ]
```

Scheduled campaigns should appear in the campaign list as:

```text
Scheduled
10 Oct 2026, 10:00 AM
```

The user should be able to cancel a scheduled campaign before processing begins.

---

# 18. Sending Architecture

The sending flow should be:

```text
Campaign
    │
    ▼
Validation
    │
    ▼
Create Campaign Send Job
    │
    ▼
Create recipient-level jobs
    │
    ▼
Queue
    │
    ▼
Email Worker
    │
    ▼
Render personalized email
    │
    ▼
Existing email integration
    │
    ▼
Google Workspace mailbox
```

Do not send all emails directly inside the frontend request.

The frontend should create a campaign/send job and the backend should process the recipients.

---

# 19. Recipient-Level Rendering

For every recipient:

```text
Template
+
Recipient Data
↓
Template Renderer
↓
Personalized Subject
+
Personalized HTML
↓
Email Sending Service
```

Example:

Template:

```text
Hello {{first_name}},

Your interview is on {{interview_date}}.
```

Recipient:

```text
first_name = Rahul
interview_date = 10 October
```

Rendered email:

```text
Hello Rahul,

Your interview is on 10 October.
```

---

# 20. Campaign Activity

The Activity tab should show campaign-level and recipient-level status.

Example:

```text
Activity

Campaign Status
Sending

Progress
██████████████████░░ 45 / 50

45 Sent
3 Pending
2 Failed
```

Recipient table:

```text
Recipient       Status       Time
Rahul           Sent         10:01
Priya           Sent         10:01
Arjun           Failed       10:02
Ananya          Pending      -
```

For failed emails, store/display an understandable error.

---

# 21. Database Model

Use the existing database architecture.

Conceptually, introduce:

### campaigns

```text
id
name
description
owner_id
status
subject_template
html_template
sender
scheduled_at
created_at
updated_at
```

### campaign_columns

```text
id
campaign_id
display_name
variable_key
type
position
required
```

### campaign_rows

```text
id
campaign_id
data
status
sent_at
message_id
error
```

`data` can be JSON/JSONB where supported.

Example:

```json
{
  "first_name": "Rahul",
  "email": "rahul@gmail.com",
  "interview_date": "10 October 2026",
  "interview_link": "https://example.com"
}
```

Do not create database columns dynamically for every campaign variable.

---

# 22. Campaign Limits

The intended use case is small organizational campaigns.

Recommended product-level limit:

```text
Maximum recipients per campaign: 100
```

Typical usage:

```text
10-50 recipients
```

The UI should clearly show the count:

```text
50 / 100 recipients
```

If the user exceeds the limit:

```text
Campaign limit reached.

A campaign can contain a maximum of 100 recipients.
```

Do not attempt to bypass Google Workspace sending limits.

---

# 23. CSV Import

CSV should be an optional convenience feature, not the primary campaign model.

Inside Data:

```text
[ Import CSV ]
```

After import:

```text
Import Preview

50 rows detected.

Columns:
First Name
Email
Interview Date
Interview Link

[ Import ]
```

The imported data should become normal campaign data.

After import, the campaign behaves exactly the same as manually entered campaign data.

---

# 24. Future Google Sheets Support

Do not make Google Sheets a dependency for V1.

The internal campaign data should be the source of truth.

Later, optionally support:

```text
Import from Google Sheets
```

or potentially:

```text
Sync with Google Sheets
```

This should be an extension of the campaign data layer rather than the foundation of the campaign architecture.

---

# 25. Autosave

Campaign changes should be saved automatically where practical.

Display a subtle state:

```text
Saving...
```

then:

```text
Saved
```

Do not make the user repeatedly click "Save" for every table or editor change.

---

# 26. Draft Safety

A campaign should remain a draft until explicitly sent or scheduled.

Closing the browser should not lose:

- Recipient data
- Email template
- Subject
- Sender
- Schedule
- Campaign settings

When the user returns:

```text
Draft Campaign
Interview Selection - Round 1

Continue editing
```

---

# 27. Important Security Requirements

The application must never expose or store the user's Google Workspace password.

Use the application's existing authorized email integration.

Users of the application should only be able to send through sender identities they are authorized to use.

Every send action should have an audit record:

```text
user_id
campaign_id
recipient
sender
timestamp
status
provider_message_id
```

---

# 28. UX Principles

Keep the experience simple.

The user should understand the entire workflow without knowing anything about:

- APIs
- SMTP
- OAuth
- queues
- template engines
- databases
- JSON
- Google Workspace administration

The mental model should simply be:

```text
Create Campaign
      ↓
Add People
      ↓
Write Email
      ↓
Insert Variables
      ↓
Preview
      ↓
Send / Schedule
```

---

# 29. Do Not Overbuild V1

Do not introduce:

- Microservices
- Kubernetes
- Complex campaign analytics
- Marketing automation
- Open/click tracking
- Advanced segmentation
- Complex workflow builders
- Live Google Sheets synchronization
- Multiple email providers
- AI generation

unless the existing application already requires them.

The first implementation should be reliable and easy to maintain.

---

# 30. Future Extensions

The campaign architecture should leave room for:

### Personalized attachments

```text
{{certificate}}
{{offer_letter}}
{{invoice}}
```

### Conditional content

```text
If round == "Round 2"
    show Round 2 message
```

### Google Sheets import

### Excel import

### Saved templates

### Duplicate campaign

### Campaign cloning

### AI-assisted email writing

### AI-generated personalization

### Inbox integration

### Support tickets

### Email assignment

### AI support responses

These should be future extensions, not requirements for the initial implementation.

---

# 31. Definition of Done

The feature should be considered complete when a user can:

1. Open Personalised Mail.
2. Create a campaign.
3. Name the campaign.
4. Open the campaign workspace.
5. Add recipient data through a spreadsheet-like UI.
6. Add/rename/delete columns.
7. Automatically get variables from columns.
8. Open the mail editor.
9. Write a normal HTML/rich-text email.
10. Insert campaign variables from a variable picker.
11. Personalize the subject.
12. Preview the email for individual recipients.
13. Send a test email.
14. Validate the campaign.
15. See errors before sending.
16. Send up to the configured campaign limit.
17. Schedule a campaign.
18. See campaign sending progress.
19. See individual recipient status.
20. Return later and continue editing a draft campaign.

---

# 32. Core Product Principle

The implementation should follow one central principle:

**The Campaign is the source of context.**

The campaign contains:

```text
Campaign
│
├── Recipient Data
│
├── Variables
│
├── Email Template
│
├── Sender
│
├── Schedule
│
├── Preview
│
└── Sending Activity
```

The user should never have to manually connect these pieces.

If the user adds a column called:

```text
Interview Date
```

the application should automatically make:

```text
{{interview_date}}
```

available in the email editor.

If the user adds:

```text
Interview Link
```

the editor should automatically expose:

```text
{{interview_link}}
```

If the user changes a value in the campaign data, the preview and eventual rendered email should use the updated value.

The entire experience should feel like one connected workspace rather than several separate features.

---

# Final User Flow

```text
Personalised Mail
        │
        ▼
Create Campaign
        │
        ▼
Campaign Workspace
        │
        ├───────────────┐
        ▼               ▼
      Data             Mail
        │               │
        │               │
        └───────┬───────┘
                ▼
           Variables
                │
                ▼
             Preview
                │
                ▼
           Validation
                │
          ┌─────┴─────┐
          ▼           ▼
        Send       Schedule
          │           │
          └─────┬─────┘
                ▼
          Sending Queue
                │
                ▼
        Personalized Renderer
                │
                ▼
       Existing Email Service
                │
                ▼
        Google Workspace
                │
                ▼
        Campaign Activity
```

The implementation should prioritize **reuse of the existing application's components and services**, while making the campaign workspace feel like a polished, integrated feature rather than a separate application.