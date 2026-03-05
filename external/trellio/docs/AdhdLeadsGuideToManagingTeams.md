# The ADHD team lead's complete Trello survival guide

**The single most important thing an ADHD leader can do with Trello is build a system so simple it survives your worst executive function days.** Every setup decision should pass one test: "Will I still do this when novelty wears off in two weeks?" The research across ADHD coaches, neurodivergent professionals, and community forums converges on a clear principle — **consistency with a simple system beats sporadic use of a perfect one**. What follows is a field-tested, implementation-ready blueprint for an ADHD team lead managing a small team, drawn from coaches like Marla Cummins and Sharon Dale, community wisdom from Reddit and MetaFilter, and Trello's own automation capabilities.

---

## Your board should have five lists, not fifteen

The #1 failure mode for ADHD Trello users is overengineering. One community member captured it perfectly: "I find that I can become hyperfocused on perfecting how I set up Trello to the detriment of my actual tasks." Start with a single team board using this proven five-list structure:

**📥 Inbox** → **📅 This Week** → **⭐ Today (max 3–5 cards)** → **🔥 Doing (max 1–2 cards)** → **✅ Done**

The Inbox is your brain dump — anything goes in, no judgment, no formatting required. This is critical because capture friction kills ADHD systems. Use Trello's email-to-board feature (every board has a unique email address) or the Trello mobile app to capture tasks instantly, or paste a spreadsheet column to bulk-create cards. The goal is **zero thinking between "I need to do this" and "it's in Trello."**

The "Doing" list should be capped at **one to two cards** using the free List Limits Power-Up. One ADHD user reported: "There's never more than one item that I'm 'Doing' at any time. Even when I get distracted, it's hard to avoid that glaring one 'Doing' item." This constraint is the most impactful single change you can make. The "Today" list caps at 3–5 items — research from multiple ADHD coaches converges on **no more than three priorities per day** as the sustainable maximum.

Add a **📋 Reference** list as the first column for pinned information: team objectives, key links, recurring checklist templates. ADHD coach Sharon Dale recommends starting from visibility: "See everything and filter to hide things. That works better than when everything is hidden and I have to go looking for it." For labels, skip traditional priority systems and try **energy-level coding**: 🟢 Low Energy, 🟠 Medium Energy, 🔴 High Energy, 🟣 Brain Dead. On depleted days, filter for green- or purple-label tasks and still move forward.

For card templates, create one master card titled "*** Checklist Templates" (the asterisks force it to sort to the top) containing reusable checklists for recurring workflows — new client onboarding, weekly review steps, morning routines. When creating a new task, copy the relevant checklist rather than rebuilding from memory every time.

---

## Ten Butler automations that replace your executive function

Butler is Trello's built-in automation engine, and for ADHD users, it's the difference between a system that demands constant maintenance and one that largely runs itself. These ten specific configurations address the core executive function gaps — task initiation, follow-through, time awareness, and board hygiene.

**Auto-complete everything when you finish a task.** Create this rule: *When a card is moved to list "Done," mark the due date as complete, check all checklist items, and remove all members.* This eliminates three manual clicks per completed task. Add the reverse: *When a due date is marked complete, move the card to "Done."* Now you can complete tasks from any view with one click.

**Auto-setup when you start working.** Rule: *When a card is moved to "Doing," set the due date to 48 hours from now, add the project checklist, and join the card.* You drag one card and everything else happens. This directly attacks initiation friction — the "I need to set this up before I can start" barrier that stops ADHD brains cold.

**Recurring tasks that create themselves.** Calendar command: *Every day at 6:00 AM, create a card titled "Morning Routine" at the top of "Today" and copy the checklist from the templates card.* Add a weekly review: *Every Friday at 3:00 PM, create "Weekly Review" in "Today."* You never need to remember to create these — they appear automatically.

**Daily board reset to prevent staleness.** Calendar command: *Every day at 7:00 PM, move all cards in "Today" to "This Week."* Add: *Every Sunday at 2:00 PM, move all cards in "This Week" to "Inbox."* This forces deliberate daily task selection and prevents cards from sitting in "Today" for a week while you tune them out. **Stale boards are the leading cause of system abandonment.**

**Due date auto-surfacing for time blindness.** Due date command: *One day before a card is due, move it to the top of "Today" and add the red "Urgent" label.* Add: *When a card is 1 day past due, post a comment "@card What's the status?"* These automations compensate for ADHD time blindness by making deadlines physically impossible to miss on the board.

**Smart date recognition** saves seconds that compound: *When a card name ending with a date is entered, set the due date to that date.* Type "Call vendor next Friday at 10am" and the due date sets automatically.

**Auto-archive completed work** with a weekly calendar command: *Every Monday at 9:00 AM, archive all cards in "Done."* Or create a board button labeled "🧹 Clean Up" that archives all Done cards on demand. Either way, your board stays uncluttered without manual housekeeping.

**Auto-sort by urgency:** *When a card is added to "Inbox," sort the list by due date ascending.* This removes the decision of what to work on next — the answer is always the top card.

Note on quotas: the free Trello plan has limited automation runs per month. The **Standard plan at $5/user/month** provides 1,000 runs — sufficient for a small team. Premium ($10/user/month) offers unlimited runs.

---

## The Power-Ups that actually earn their keep

Not all Power-Ups are equal. These six specifically reduce friction for ADHD users, ranked by impact:

**Calendar Power-Up (free, built-in)** displays all due-dated cards in weekly or monthly view. Drag cards to reschedule. Export the iCalendar feed to Google Calendar so Trello deadlines appear alongside your meetings — this is essential for combating the "out of sight, out of mind" problem. Setup takes 30 seconds: Power-Ups → Calendar → Enable sync → copy URL to Google Calendar's "From URL" option.

**Card Repeater (free)** automatically copies cards on a schedule. Set your weekly team standup prep, monthly invoicing, or quarterly review to auto-generate. Critical detail: archiving a repeated card does NOT stop the repetition — only deleting or canceling it does.

**List Limits (free)** enforces WIP constraints visually. Set "Doing" to 1–3 cards and "Today" to 3–5. The warning that appears when you exceed the limit creates a powerful moment of forced prioritization.

**Twilio SMS via n8n (~$1.50–2.50/mo)** turns your phone into a command center without another app to check. Wire up n8n to send morning briefings ("You have 3 cards due today"), afternoon reminders for stale "Doing" cards, and gentle nudges during crash-recovery weeks — all as plain text messages. SMS has the highest open rate of any notification channel, which matters when your brain is aggressively ignoring app badges. For task capture, use Trello's email-to-board feature (forward emails, send yourself quick notes) or the Trello mobile app — both get tasks onto the board with near-zero friction.

**Card Aging (free)** makes neglected cards gradually transparent. This visual decay is a powerful cue — you can spot stale tasks at a glance without checking dates.

**Card Snooze** temporarily hides cards until a specified time, perfect for "not now but definitely later" tasks that would otherwise clutter your view and contribute to overwhelm.

---

## Why your system will break — and the protocol for when it does

Every ADHD productivity system follows a predictable arc: **two weeks of enthusiasm, gradual neglect, complete abandonment, and a fresh wave of shame.** This isn't a character flaw — it's neurochemistry. ADHD brains produce less baseline dopamine in the prefrontal cortex, making motivation dependent on novelty and interest rather than importance. When the novelty of a new Trello setup fades, the dopamine that powered the initial configuration evaporates.

The experienced ADHD community doesn't try to prevent this cycle. They **plan for the crash**. ADHD coach Sharon Dale openly states: "Even with all of this in place I will become overwhelmed, have to assert task manager bankruptcy and start again. It takes longer to get to that point though." The writer who deleted 47 productivity apps concluded: **"It is better to consistently use a simple system than to use a perfect one sporadically."**

Build these crash-recovery mechanisms into your system from day one. First, create a **minimum viable routine** for low-energy days: just open Trello and look at it. Habit-stack this to an existing behavior — "After I pour my morning coffee, I open Trello." Research suggests habit formation takes **18 to 200 days**, and ADHD individuals should expect the longer end. Second, schedule a **monthly "system health check"** (Butler can auto-create this card) where you ask: What's working? What's annoying? What can I remove? The goal is tweaking, not overhauling — ADDitude Magazine recommends three-month evaluation cycles. Third, when the system does decay beyond repair, have a **restart protocol**: archive everything, keep your Butler rules and Power-Ups intact, and begin fresh. The infrastructure survives; only the stale content gets cleared.

The meta-insight from Ryan McRae, author of *Ordering the Chaos*: "If I kept with a system for more than two weeks, I knew it worked. If I found I abandoned it, I figured out why." Ask yourself honestly: "Am I dissatisfied with the tool, or am I avoiding the work?" ADHD coach Paula Engebretson calls the endless search for better tools "procrastiworking" — the most sophisticated form of procrastination.

---

## Leading your team when you can barely lead your own task list

The paradox of the ADHD team lead is real: you must enforce processes you personally find difficult. The solution isn't becoming more disciplined — it's **building systems that don't depend on your discipline.**

**Hire for your gaps, not your strengths.** Designate a detail-oriented team member as your "operations partner" who formally owns status tracking, follow-ups, and deliverable timelines. This isn't dumping work — it's strategic role design. Executive coach Skye Waterson calls it "hands in your pockets leadership": your highest value is vision and strategy, not tracking every checkbox. One Fortune 500 CFO with ADHD transformed her effectiveness by implementing a visual dashboard, capping daily priorities at three, and using voice memos instead of written notes — within six months she was "leading from a place of clarity and calm."

**Structure your meetings as bidirectional accountability.** Daily standups should use the "Walk the Board" method: go through Trello cards right-to-left rather than asking each person for a status update. This keeps the ADHD leader engaged (you're looking at visual cards, not zoning out during monologues) while simultaneously reviewing your own commitments alongside the team's. Keep standups to **15 minutes maximum**. For weekly planning sessions, use a template: review last week's goals, identify what didn't get done and why, set 3–5 priorities for next week, update the board together. The weekly review is the single most important ritual — even 30 minutes prevents chaos from compounding.

**Frame your needs as team practices, not personal accommodations.** Instead of "I have ADHD and need help tracking things," say: "I've found our team works better with visual boards and structured check-ins — these help everyone stay aligned." The truth is, ADHD-friendly systems genuinely benefit neurotypical team members too. Clear agendas, documented processes, visual tracking, and structured accountability are universal best practices. You're not asking for special treatment; you're implementing good management.

**Use body doubling as a team ritual.** Schedule 50-minute "deep work" blocks where everyone works on their own tasks simultaneously — on a video call or in the same room. At the start, each person declares what they'll accomplish. At the end, a quick round of what got done. This creates mutual accountability without hierarchy, and the ADHD leader benefits from the same social facilitation as everyone else. Tools like Focusmate and Flow Club formalize this for remote teams.

**Rotate the accountability lead role weekly.** One team member each week is responsible for walking the board during standup, flagging stale cards, and sending end-of-day status summaries. This distributes the cognitive load of system maintenance across the team rather than concentrating it on the person least neurologically equipped for it. Frame it as leadership development, not outsourcing your weakness.

---

## The four-week implementation roadmap

Don't set up everything at once. The hyperfocus-fueled configuration marathon is the first step toward abandonment. Follow this graduated rollout:

**Week 1 — Foundation.** Create one team board with five lists (Inbox → This Week → Today → Doing → Done). Add the Calendar and List Limits Power-Ups. Set "Doing" limit to 2 cards and "Today" limit to 5. Add one label set (energy levels: Low/Medium/High). Habit-stack: open Trello with your morning coffee every day. That's it.

**Week 2 — Automation.** Add four Butler rules: auto-complete on Done, auto-setup on Doing, daily board reset at 7 PM, and one recurring task (weekly review on Fridays). Test each rule to confirm it works. Resist the urge to add more.

**Week 3 — Integration.** Set up Twilio SMS integration in n8n for automated morning briefings and reminder nudges throughout the day. Enable Trello's email-to-board for quick task capture from any device — save the board's unique email address in your contacts so it's always one tap away. Add Card Repeater for your top 2–3 recurring tasks. Sync Calendar Power-Up to Google Calendar.

**Week 4 — Team rituals.** Implement daily 15-minute "Walk the Board" standups. Schedule the weekly review session. Assign the first rotating accountability lead. Add due date auto-surfacing Butler rules. Evaluate what's working and remove anything that feels like friction rather than relief.

**After Week 4**, add complexity only when you feel a genuine need — never preemptively. If something sounds useful but you're not sure you need it, you don't need it yet.

---

## Conclusion

The fundamental insight running through all of this research is that **ADHD-friendly productivity is not about finding the right tool — it's about building the right scaffolding around any tool**. The scaffolding has three components: automation that replaces executive function (Butler rules handling what your working memory won't), external accountability that replaces internal motivation (team rituals, body doubling, SMS nudges), and deliberate simplicity that survives the inevitable crash (five lists, three daily priorities, one "Doing" card at a time).

The ADHD community's hard-won wisdom is blunt: your system will break. The measure of success isn't maintaining a perfect board — it's how quickly you restart after a lapse. Build your Trello setup knowing that your future low-energy self will be the one using it. Every card template, every Butler rule, every automated reminder is a gift from your current hyperfocused self to that person. Make the gifts simple enough to unwrap on your worst day.
