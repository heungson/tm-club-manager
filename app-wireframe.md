# Dongtan Toastmasters Club Manager

*Electron desktop app wireframe · Sample names and meeting details*

The app opens to **Meetings**. The left sidebar stays in place as you switch between preparing a deck, asking the assistant for help, managing members, and opening your own speech scripts. **Settings → Connections** is where you link club files and set up the assistant engines.

Bracketed controls show proposed desktop buttons and fields.

### Visual identity

The desktop app and presentation template use Toastmasters' True Maroon `#772432`, Loyal Blue `#004165`, Cool Gray `#A9B2B1`, and Happy Yellow `#F2DF74`. The sidebar uses Loyal Blue, primary actions use True Maroon, and Happy Yellow accents the active navigation and slide labels. The app bundles Montserrat for headings and Source Sans 3 for body text. [Toastmasters Brand Manual](https://content.toastmasters.org/image/upload/02330-001-0001-brand-manual.pdf)

Use the desktop toolbar for tools available on every page. Give each workspace one main focal point and use shared spacing, surface colors, and borders in both themes. In Meetings, the meeting theme and date establish context, and the audience preview gets the most space.

### Desktop controls

- Use familiar icons for compact controls such as closing a panel, starting a conversation, or moving an agenda item up or down. Give each icon-only button an accessible name, hover tooltip, visible keyboard focus, and a 40 × 40 px hit area.
- Pair a graphic with a visible label in the sidebar, on **Open Assistant**, and on the presenter’s **Previous** and **Next** buttons. Use visible labels for actions such as **Save agenda**, **Present…**, and **Remove…**. Give attachment chips an accessible name that identifies what will be removed.
- Give the main action for the current task the maroon treatment. Keep supporting controls visually quieter and use the same icons for the same actions across pages. Check hover and focus states in light and dark themes.

[Fluent button guidance](https://fluent2.microsoft.design/components/web/react/core/button/usage) · [W3C button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)

## 1. Meetings and slide generation

```text
┌─ Dongtan Toastmasters Club Manager ────────────────────────────────── ─ □ × ┐
│  DONGTAN              Club workspace                      [Open Assistant] │
│  TOASTMASTERS                                                               │
│                       MEETINGS                             [Refresh sheet] │
│  ▸ Meetings                                                                 │
│    Role Guide         MEETING #44            [#44 · Mon, Nov 9, 2026 ▾]    │
│    Members            Small beginnings               Club meeting sheet    │
│    My speeches        Mon, Nov 9, 2026                                      │
│    Pathways                                                                 │
│    Settings           [Slides ●]  [Agenda]  [Roles]  [Meeting details]       │
│                                                                             │
│                       Slide deck          [Rehearse] [Present…] [Export…]  │
│                       AUDIENCE PREVIEW          1 / 10       SLIDE ORDER    │
│                       ┌──────────────────────────────┐      01 Welcome      │
│                       │ DONGTAN TOASTMASTERS         │      02 Meeting roles│
│                       │                              │      03 Word & quote │
│                       │ Small beginnings             │      04 First speech │
│                       │ Meeting #44                  │      05 Second speech│
│                       └──────────────────────────────┘      …               │
│                       Presenter cue             [Choose image…]             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Selecting a meeting builds its slide preview from that meeting's saved agenda. The app combines the ordered agenda items with the meeting date, theme, word and quote, and role assignments. The slide order sits to the right of the preview and moves below it in a narrower window. **Meeting details** shows the source values and flags missing fields. A meeting marked **No meeting** has no deck, and awards slides can display category names while winners are still pending.

The app keeps the last synced meeting available if the workbook is temporarily unreachable and shows when it was last synced.

| Control | Behavior |
| --- | --- |
| **Meeting picker** | Defaults to the next scheduled meeting. Pick a different date to load its role list, meeting details, and deck. |
| **Agenda** | Edit the order and contents of this meeting, including prepared speeches, Debate, and other optional sessions. |
| **Refresh sheet** | Reloads the selected meeting and updates its preview. If Google is unreachable, show the cached meeting and its last sync time. |
| **Slide list** | Click a slide title to preview it. The preview shows its source fields and, for image slots, a **Choose image…** button. |
| **Rehearse** | Opens presenter controls and a simulated audience screen on the same display. |
| **Present…** | Opens display setup so the operator can choose where the audience slideshow appears. |
| **Export…** | Opens a save dialog for a PowerPoint deck with embedded images. The export reflects the preview at the time it is saved. |

### Build a different agenda for each meeting

*Officer view · Example meeting with three speeches and a debate*

```text
┌─ Meetings / Agenda · Meeting #45 ──────────────────────────────────────────────┐
│ [Start from format…]  [Add speech]  [Add segment ▾]                            │
│                                                                                │
│ ORDER  AGENDA ITEM                     TIME       SELECTED ITEM                │
│ 01     Welcome and introductions      10 min    Debate                         │
│ 02     Prepared speech · Mina Park      4–6 min   Motion  [Enter motion…]      │
│ 03     Prepared speech · Daniel Cho     5–7 min   Moderator [Alex Kim ▾]       │
│ 04     Prepared speech · Robin Han      5–7 min   Duration [15 min]            │
│ 05  ▸  Debate                          15 min                                  │
│ 06     Evaluations and reports         20 min       [↑] [↓]                    │
│ 07     Awards and closing              10 min    [Skip segment] [Remove…]      │
│                                                                                │
│                                                   [Cancel] [Save agenda]       │
└────────────────────────────────────────────────────────────────────────────────┘
```

| Control | Behavior |
| --- | --- |
| **Start from format…** | Copies a starting agenda such as **Regular meeting** or **Speech marathon** into this meeting. If the meeting already has a saved agenda, ask before replacing it. |
| **Add speech** | Adds one speech item with its own speaker, evaluator, project, title, and time range. Repeat for each planned speech. |
| **Add segment ▾** | Offers Debate, Table Topics, Break, Education Session, and a custom segment. Debate has fields for the motion, moderator, and duration. |
| **Move up / Move down** | Reorders the selected item. The deck follows the saved order. |
| **Skip segment / Include segment** | Toggles whether the item appears in the deck and presenter cues. The item stays available in the editor if plans change again. |
| **Remove…** | Removes the item from this meeting's agenda after confirmation. |
| **Save agenda** | Saves the agenda for this meeting, updates its role slots, and rebuilds the slide preview. Missing speaker details or a missing debate motion are flagged in the editor. |

A regular meeting can have two speeches and Table Topics. A debate meeting can have three speeches, a Debate segment, and its own running order. Every included speech gets its own title slide, and the evaluation segment pulls pairings from the included speeches. If Debate is included, the deck adds its motion slide and a handoff cue for the moderator. Slide numbers and **Up next** follow the generated deck.

In the native meeting spreadsheet, an `Agenda Items` tab has one row per item with `meeting_id`, `item_id`, `position`, `type`, `included`, and the item's details. The app can seed an older meeting from its existing `26_Roles` speech fields. Once an agenda is saved, speech and segment details come from `Agenda Items`. `26_Roles` continues to supply meeting details and standing roles. Stable item IDs keep slide images and evaluator pairings attached when items move.

### Print the planned schedule

In **Meetings → Agenda**, use **Set meeting times…** to enter the planned start and target finish in KST. Set **Planned minutes** for each included segment. The app adds those minutes in agenda order and shows the projected finish and any overrun. The speech time limit remains a separate field. For a 5–7 minute speech, a nine-minute segment can leave room for the introduction and written feedback.

Choose **Open workbook agenda** to use the club’s existing A4 format. The app opens the dated agenda tab in a connected workbook when one matches the meeting, or opens **Agenda Template**. For an imported Excel workbook, it opens the original file and shows which tab to select. The existing template uses its own time cells and formulas.

Choose **Preview printed agenda…** for the app’s A4 handout. It follows the club workbook’s two-column layout, with the meeting details on the left and the program on the right. It shows the current selections, including unsaved edits, with start and end times, role takers, and each speech’s project, title, time limit, speaker, and evaluator. Skipped segments stay off the handout and missing times appear as **TBD**. In a connected workbook, the `Meeting Schedule` tab stores app timing by meeting and item ID.

### Assign role takers for the next meeting

*Officer view*

```text
┌─ Meetings / Roles ────────────────────────────────────────────────────────────┐
│  [Next meeting: Mon, Nov 9 · #44 ▾]        1 open role   [Show open only]     │
│                                                                               │
│  ROLE             ASSIGNED TO              ASSIGN EVALUATOR 2                 │
│  Toastmaster      Jamie Lee    [Change]    [Search members…]                  │
│  Speaker 1        Mina Park    [Change]    Eligible members                   │
│  Evaluator 2      Open         [Assign]    (●) Robin Han · No role yet        │
│                                           ( ) Jamie Lee · Toastmaster         │
│                                                                               │
│                                           [Cancel]  [Save assignment]         │
└───────────────────────────────────────────────────────────────────────────────┘
```

1. Open **Meetings**, select **Next meeting**, and go to **Roles**. The list shows imported assignments and open slots. Use **Show open only** to find vacancies.
2. Select **Assign** next to an open role or **Change** next to a filled one. Search for a member. The picker filters by the club's eligibility rules and shows any other roles the member already holds at that meeting.
3. Choose the member and select **Save assignment**. The saved name appears on the role list and in the slide preview. Use **Change** to replace the person or reopen the slot.

For standing roles such as Chairperson or Toastmaster, **Save assignment** writes the display name to `26_Roles` and the member ID to `Assignment IDs`. For agenda roles such as a speaker, their evaluator, or a Debate moderator, it saves the assignment on the corresponding `Agenda Items` row. **Agenda** and **Roles** use that same row. **Reopen role** clears the name and ID. If the app sees that the role changed since the officer opened it, it reloads the assignment and asks them to review the current name before saving. A failed save keeps the officer's selection in the picker so they can retry.

### Role Guide

Open **Role Guide** from the sidebar, or select a role name under **Meetings → Roles**. Use the grouped role picker or search by role or duty. The instructions below show what to prepare and what to do during the meeting. The guide includes optional club duties such as Quiz Master and Debate Moderator. [Toastmasters club meeting roles](https://toastmasters.org/Membership/Club-Meeting-Roles)

Choose **Toastmaster**, or use **Prepare to host** in **Meetings → Roles**. The guide shows the selected meeting, the assigned host, and three ways back into preparation.

```text
Toastmaster of the Day
Meeting #44 · Mon, Nov 9, 2026 · Small beginnings
[Open agenda]  [Review roles]  [Open slides]

What needs attention            Before you host
Timer                           Agree on the agenda and backup roles.
Item 5 · Evaluator open         Collect introductions and project details.
                                Rehearse the deck and check who has arrived.

Run of show
01  Welcome                     Take over from the Chairperson.
…   The first five minutes      Introduce the speaker. Allow time for feedback.
…   Evaluations and reports     Hand over to the General Evaluator.

Sample handoffs · If the plan changes · After the meeting
                                [Open Toastmasters script and log…]
```

The run of show follows included agenda items in their current order and shows recorded time limits, owners, speech projects, evaluator pairings, and presenter cues. Skipped items disappear, so the same guide works for a regular meeting, a speech marathon, or a debate. Gaps reflect missing entries in the app. The host confirms availability, introductions, and project objectives directly. The guide marks unsaved agenda edits because Slides rehearses the saved deck. [Toastmasters host guidance](https://www.toastmasters.org/membership/club-meeting-roles/toastmaster.aspx) · [Toastmaster Script and Log](https://www.toastmasters.org/resources/toastmaster-script-and-log)

### Choose a slide image

```text
┌─ Choose image · Welcome background ────────────────────────────────────────────┐
│ [Search club images…]                                   [Upload from device…]  │
│                                                                                │
│ CLUB IMAGES                 PREVIEW                                            │
│ ● Meeting room.jpg          ┌──────────────────────────┐                       │
│   Group photo.jpg           │     Small beginnings     │                       │
│   Club logo.png             │    (background preview)  │                       │
│                             └──────────────────────────┘                       │
│                             [Fill ▾]   [Alt text…]                             │
│                                                                                │
│ [Use template image]                              [Cancel] [Apply to slide]    │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Upload from device…** opens the system file picker for a PNG or JPEG and adds the selected file to the club's Drive folder. **Fill** crops to the image slot. **Fit** shows the full image inside it. **Apply to slide** saves the selection for this meeting and slide slot. **Use template image** selects the default for that slot. If a custom image can't be loaded, the preview shows the template image and identifies the missing asset before export or presentation.

### Present the meeting

#### Set up the audience display

```text
┌─ Present meeting #44 ──────────────────────────────────────────────────────────┐
│ Audience display    [Display 2 · Projector ▾]  [Identify displays]             │
│ Presenter controls   Display 1 · Laptop                                        │
│ Starting slide      [01 · Welcome ▾]                                           │
│                                                                                │
│                                                [Cancel] [Start presentation]   │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Identify displays** briefly shows a number on each connected screen. **Start presentation** opens the deck full-screen on the chosen display and keeps the controls on the laptop. If only one display is connected, setup offers **Rehearse** or **Start slideshow**. In single-display slideshow mode, the screen shows the audience deck and the operator navigates with arrow keys or a clicker. **Esc** returns to the app.

#### Laptop and projector during the meeting

```text
┌─ Laptop · Presenter view ──────────────────────────────────────────────────────┐
│ Meeting #44      Live on Display 2                              [End show…]    │
│                                                                                │
│ SLIDE 04 OF 10             PRIVATE PRESENTER CUES                              │
│ ┌─────────────────────┐   Toastmaster → Mina Park                              │
│ │  PREPARED SPEECH 1  │   Introduce Mina and her Ice Breaker project.          │
│ │  The first five     │   Hold this slide while the Timer signals.             │
│ │  minutes            │   Advance after applause and time for written feedback.│
│ │  Mina Park · 4–6 min│                                                        │
│ └─────────────────────┘   UP NEXT  05 · Prepared speech 2                      │
│                                                                                │
│ [Go to slide ▾]     [Blank screen]                        [Previous] [Next]    │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ Projector · Audience screen ──────────────────────────────────────────────────┐
│ DONGTAN TOASTMASTERS                                               MEETING 44  │
│                                                                                │
│                         The first five minutes                                 │
│                           Mina Park · Ice Breaker                              │
│                             Target · 4–6 min                                   │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

| Control | Behavior |
| --- | --- |
| **Previous / Next** | Moves both views one slide. Left and right arrow keys do the same. The operator advances at the handoff. The Timer signals independently. |
| **Go to slide** | Lists the full deck by section and title. Select a slide to jump there if the agenda order changes. |
| **Blank screen / Resume screen** | Blacks out the projector during an interruption. The operator can navigate privately while blanked and resume on the selected slide. |
| **End show…** | Asks for confirmation, closes the audience window, and returns to the slide editor. |

The slideshow uses a snapshot of the deck taken at launch, including its images. If the projector disconnects, the app pauses projection and opens display setup on the laptop with the current slide selected.

#### Slide cues by meeting segment

This example follows Meeting #44's agenda. The numbering and included segments vary by meeting.

| Slide | Audience sees | Presenter action |
| --- | --- | --- |
| **01 · Welcome** | Theme, meeting date, and club image | Leave it up as guests arrive. Advance when the Chairperson hands over to the Toastmaster. |
| **02 · Meeting roles** | Names of the Toastmaster, Topicsmaster, and evaluation team | Invite role takers to explain their duties. |
| **03 · Word and quote** | Word, example, and quote of the day | Invite the Grammarian or Word and Quote Master to introduce them. |
| **04–05 · Prepared speeches** | One title slide per scheduled speaker, with project and time range | Advance as each speaker is introduced. Hold the slide through the speech and leave time for written feedback. |
| **06 · Break** | Return time | Leave it up until the Topicsmaster is ready. |
| **07 · Table Topics** | Section title and Topicsmaster | Let the Topicsmaster give prompts aloud and call on participants. |
| **Optional · Debate** | Motion and moderator | Hand over to the moderator and hold the motion on screen while they run the debate. |
| **08 · Evaluations** | Speech and evaluator pairings, followed by the role reports | Hand over to the General Evaluator for feedback and reports. |
| **09 · Awards** | Award categories and winners when available in the deck | Leave categories up while votes are tallied. Announce live results aloud. |
| **10 · Closing** | Next meeting date, role sign-up, and group photo reminder | Invite guest feedback and sign-ups, then end the show after the Chairperson closes. |

## 2. Assistant

**Open Assistant** stays in the top toolbar on every desktop page. It opens a panel with conversations, a model picker, and attachments. Click **Hide Assistant**, click the panel’s **×**, or press **Esc** to collapse it and return focus to the launcher. The current conversation and draft stay available when you reopen it. **Ask Assistant** on a script opens this panel with that script attached. In Presenter view the launcher appears on the laptop, while the audience display shows the slide.

```text
┌─ Assistant ─────────────────────────────────────────────────────── [✎] [×] ┐
│  CONVERSATIONS        Meeting #44 deck review                               │
│                       Context  [Meeting #44 ×]         [Add context…]       │
│                                                                             │
│  ● Deck review        YOU                                                   │
│    Speech rehearsal   Check the deck and draft a shorter opening slide.     │
│                                                                             │
│                       ASSISTANT                                             │
│                       Evaluator 2 is open. Here's a draft opening slide.    │
│                       [Review draft]                                        │
│                                                                             │
│                       [Ask about the meeting or an attached script…]        │
│                       [Model ▾] [Reasoning effort ▾]                  [Send] │
└─────────────────────────────────────────────────────────────────────────────┘
```

The **Model** menu beneath the message box groups choices by **Codex CLI** and **Claude Code CLI**. Codex supplies its model catalog and supported reasoning levels. Claude uses the default or a selected model family. Switching models within one provider keeps the conversation. Switching providers starts a new conversation on the next send. The context bar shows the meeting fields or owned script that will be sent with the message. **Review draft** shows the proposed slide text and lets an officer apply it to the deck preview.

- The compose icon in the header opens a new conversation. Selecting an item in **Conversations** reopens its thread.
- **Add context…** opens a picker for a meeting or an owned script. The **×** on a context chip removes it from future messages.
- **Send** runs the selected model and changes to **Stop** while the reply is in progress. If Codex model discovery fails, the picker keeps the CLI default available.
- **Review draft** opens the current slide beside the proposal, with **Apply to slide** and **Back to chat**.

## 3. Members

*Officer view*

```text
┌─ Members ─────────────────────────────────────────────────────────────────────┐
│  [Search members…]   [Status: All ▾]   [Type: All ▾]          [+ Add member]  │
│                                                                               │
│  NAME          MEMBERSHIP     STATUS      UPCOMING ROLE     MEMBER DETAILS    │
│  Jamie Lee     Paid member    Active      Toastmaster       Mina Park         │
│  Mina Park     Paid member    Active      Speaker 1         Paid · Active     │
│  Alex Kim      Guest          Active      —                 ID · M-018        │
│                                                             [Edit member]     │
│                                                 [Role history] [Mark inactive]│
└───────────────────────────────────────────────────────────────────────────────┘
```

Officers can add and update member records, review role history, and check eligibility when filling roles. The workbook's `25_Authority` tab provides a starting point for paid member, guest, and honorary member eligibility. Officers can confirm those rules before the app enforces them.

- **Search members**, **Status**, and **Type** filter the directory. Selecting a row opens the member's details.
- **Add member** and **Edit member** open a form for display name, membership type, status, and join date. **Save member** appends a row for a new member or updates the existing row by member ID. **Cancel** returns to the directory.
- **Mark inactive** removes the person from the eligible-member picker, preserves their role history, and flags upcoming assignments for review. **Reactivate** restores them to the picker subject to the club's eligibility rules.
- **Role history** looks up assignments by member ID and links back to each meeting's **Roles** tab. For older name-only assignments, the app links a name when it identifies one roster record and leaves ambiguous matches for officer review.

The native `Members` table has one row per person with `member_id`, `display_name`, `membership_type`, `status`, and `joined_on`. When the meeting workbook is shared with the club, use a separate roster spreadsheet shared with officers. App sign-in and officer permissions are managed in the app's account service.

## 4. My speeches

*Member view*

```text
┌─ My speeches ───────────────────────────────────────────────────────────────┐
│  [Search my speeches…]                                      [+ New script]  │
│                                                                             │
│  YOUR LIBRARY                  THE FIRST FIVE MINUTES                       │
│  ● The first five minutes      [Draft ▾]                                    │
│    Draft · Updated today       Pathways: Ice Breaker   Target: 4–6 min      │
│                                                                             │
│    A lesson from the trail     ┌──────────────────────────────────────┐     │
│    Delivered · Oct 26          │ The first time I stood at a lectern, │     │
│                                │ five minutes felt like an hour…     │      │
│                                └──────────────────────────────────────┘     │
│                                [Ask assistant about this script]    [Save]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

Members can save drafts, reopen delivered speeches, and search their own library. **Ask assistant about this script** opens a conversation with the script visibly attached. The meeting deck uses the scheduled speech title and project from the meeting agenda. The script body is private to its author.

- **New script** opens an editor for title, Pathways project, target time, and script text. **Save** stores the changes in the member's library.
- **Draft / Delivered** changes the script's status. **Search my speeches** filters the library by title.
- **Ask assistant about this script** carries the saved script into a new chat. If the editor has unsaved changes, prompt the member to save before opening the chat.

## 5. Settings and connections

**Appearance → Color theme** offers **System**, **Light**, and **Dark**. System follows the desktop appearance. The app saves this preference on the current device. The preview, audience display, and PowerPoint export use the club slide palette in every mode.

```text
┌─ Settings / Connections ───────────────────────────────────────────────────────┐
│ CONNECTION            STATUS                  ACTION                           │
│ Google Drive & Sheets Connected               [Manage Google…]                 │
│   Meetings            Dongtan meeting sheet   [Choose spreadsheet…]            │
│   Member roster       Officer roster          [Choose roster…]                 │
│   Slide images        Club images folder      [Choose folder…]                 │
│                                                                                │
│ Codex CLI             Detected · Ready        [Test connection]                │
│ Claude Code CLI       Detected · Key needed   [Configure credential…]          │
│                                                                                │
│                                   [Disconnect Google]                          │
└────────────────────────────────────────────────────────────────────────────────┘
```

| Control | What happens |
| --- | --- |
| **Connect Google / Manage Google…** | Opens Google consent in the system browser. A desktop OAuth client uses PKCE and a local callback. When the user returns, the app shows the connected account and selected files. |
| **Choose spreadsheet… / Choose roster…** | Opens Google Picker to grant access to the selected native Sheet for the signed-in account. The app checks for `26_Roles` and the agenda schema in the meeting file, and the `Members` table in the roster. It shows which file needs attention if a required tab or column is missing. |
| **Choose folder…** | Selects the Drive folder for uploads. **Choose image…** can also open Google Picker to grant access to an existing image. The app stores Drive IDs and uses the connected account's access to retrieve the files. |
| **Disconnect Google** | Removes the saved Google credentials from this installation and prompts for a new connection when the user next needs Sheets or Drive access. |
| **Detect Codex / Sign in…** | Finds the installed Codex CLI. If authentication is needed, starts the supported Codex account flow. **Test connection** checks that the local process responds and reports its account status. |
| **Detect Claude Code / Configure credential…** | Finds the installed Claude Code CLI and configures an Anthropic API key or supported provider credentials for the embedded chat. A connection test that sends a model request is labeled as such before it runs. |

### How the connections run

- **Google.** Enable the Drive, Sheets, and Google Picker APIs in a Google Cloud project and create a desktop OAuth client. Request `drive.file` access for files the user selects or the app creates. The linked Excel workbook needs a one-time **File → Save as Google Sheets** conversion before it can serve as the write-back target. Connect the resulting native Sheet through the picker.
- **Codex.** The Electron main process starts `codex app-server` as a local child process and exchanges JSON-RPC messages over standard input and output. It streams replies to the Assistant pane and stores the Codex thread ID for resuming each conversation.
- **Claude.** The main process starts `claude -p` with `--output-format stream-json`, reads the streamed events, and retains the Claude session ID to resume the conversation. The Assistant pane uses the same **Send**, **Stop**, and draft review controls for either engine.
- **Credentials and edits.** The main process keeps app-managed credentials in OS-backed storage and lets Codex manage its own sign-in. It exposes specific operations to the UI. The assistant receives the attached context with its tools restricted for drafting. **Apply to slide** is an app action that checks the officer's access before applying the proposal.

[Google desktop OAuth](https://developers.google.com/identity/protocols/oauth2/native-app) · [Google Picker for desktop apps](https://developers.google.com/workspace/drive/picker/guides/desktop-mobile-picker) · [Codex App Server](https://learn.chatgpt.com/docs/app-server) · [Claude Code programmatic mode](https://code.claude.com/docs/en/headless) · [Claude authentication guidance](https://code.claude.com/docs/en/legal-and-compliance)

## Data and access

| Area | Proposed first version |
| --- | --- |
| Meeting data | Use a native Google Sheets copy of the linked Excel workbook. Keep meeting details and standing roles in `26_Roles`, and save each meeting's ordered agenda and agenda-specific assignments in `Agenda Items`. Keep a dated local cache for previews. |
| Slide images | Store image files in the club's Drive folder. A `Slide Images` tab maps meeting ID, agenda item ID, and image slot to a Drive file ID, crop setting, and alt text. |
| Decks | Build slides and presenter cues from the included agenda items in saved order. Embed the resolved images in each PowerPoint export. |
| Member roster | Store membership records in the native `Members` table. Use a separate officer-only spreadsheet if the meeting workbook is shared more broadly. |
| Accounts and private scripts | Store in the app's account-backed data service. Enforce officer permissions and owner-only script access there. |
| Assistant | Run the selected CLI locally using its configured provider credentials. Pass the attached context and let officers review generated slide edits before applying them. |

## 6. Pathways in Chrome or Edge

I checked the signed-in flow in Chrome. On [Toastmasters My Home](https://www.toastmasters.org/myhome), choose **Go to Base Camp** under **My Education and Achievements**. In Base Camp, **Paths & Learning** separates **Active** and **Completed** paths. Choosing a path can open the last visited project. The path name in the breadcrumb opens its outline, where expanding a level exposes project links and completion labels.

In the Ice Breaker project, the first page contains a **Resources** section inside the project frame. I verified links labeled **Evaluation Resource**, **Print the Ice Breaker Project**, and **Ice Breaker Speech Outline Worksheet**. The dashboard also has a **Resources** tab for browsing resources across projects. [Toastmasters education FAQ](https://www.toastmasters.org/EducationFAQ)

```text
┌─ My Pathways ──────────────────────────────────────────────────────────────┐
│ Browser [Chrome ▾]   [Open TMI / Sign in…]         [Load paths]             │
│                                                                            │
│ ACTIVE PATHS           PROJECTS                  RESOURCES                 │
│ Visionary Communication [Read progress]          [Open in browser]         │
│                        Level 1 · Ice Breaker      Evaluation Resource       │
│                        [Find project resources]  Print the Ice Breaker     │
│                                                                            │
│                       [Attach findings to Assistant]                      │
└────────────────────────────────────────────────────────────────────────────┘
```

**Open TMI / Sign in…** opens a dedicated local Chrome or Edge profile. The member enters their credentials directly on the Toastmasters site. **Load paths** opens Base Camp and reads the dashboard. **Read progress** reads the selected path's visible level and project labels. **Find project resources** reads links for the selected project. **Open in browser** opens the original resource for the member to view or download. **Attach findings to Assistant** gives the selected CLI the visible results for that conversation.

In chat, **Allow Pathways lookup** grants read access for the next message. The selected engine can list paths, read progress, or find project resource links through the browser bridge. The app tells the member that the findings are sent to the selected model provider. Browser credentials and session cookies stay with the browser profile.

**Save PDF…** opens the desktop save dialog for a resource that returns a PDF. A printable project page can be opened in the browser and printed there.

## Running the desktop prototype

From this folder, run `npm install`, then `npm start`. The app starts with sample data. **Settings** can import an Excel workbook or connect a native Sheet through Google OAuth. Configure `TM_GOOGLE_CLIENT_ID` and `TM_GOOGLE_CLIENT_SECRET` in the process environment or a local `.env` file to enable Google Picker. For Claude chat, use a Claude Code build that supports `--tools` and `--include-partial-messages`, then configure `ANTHROPIC_API_KEY` or credentials for a supported provider before launching the app. Codex uses the installed CLI's account.

The prototype stores its cache, speech library, roster fallback, and chat history in the current desktop profile. A shared application account service is a separate deployment requirement.
