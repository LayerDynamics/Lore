# Butler Automation Rules - Manual Setup

Butler rules cannot be created via the Trello API. Follow these steps in the Trello UI.

**Where to go:** On your board, click **"Automation"** (robot icon in top menu) or go to https://trello.com/butler

---

## Rule 1: Auto-complete on Done

**What it does:** When a card moves to Done, marks due date complete and checks all checklist items.

1. Butler > **Rules** > **Create Rule**
2. Trigger: `when a card is moved into list "Done"`
3. Actions:
   - `mark the due date as complete`
   - `check all the items in all the checklists on the card`
4. Save

---

## Rule 2: Auto-setup on Doing

**What it does:** When a card moves to Doing, adds a working checklist, sets a deadline, and joins you to the card.

1. Butler > **Rules** > **Create Rule**
2. Trigger: `when a card is moved into list "Doing"`
3. Actions:
   - `set due date 4 hours from now`
   - `add me to the card`
   - `copy checklist "Task Kickoff" from card "*** Checklist Templates"`
4. Save

---

## Rule 3: Daily Board Reset

**What it does:** Every evening, sweeps Today cards back to This Week for a fresh start.

1. Butler > **Calendar** > **Create Command**
2. Schedule: `every weekday at 7:00 PM`
3. Action: `move all cards in list "Today" to the top of list "This Week"`
4. Save

> **Team note:** If team members keep cards in Today overnight, change action to: `move all cards assigned to me in list "Today" to the top of list "This Week"`

---

## Rule 4: Recurring Tasks (Card Repeater)

**Uses the Card Repeater Power-Up, NOT Butler.**

### Weekly Review
1. Create a card in Today named `Weekly Review`
2. Open card > Power-Up section > **Repeat**
3. Set to repeat **every Friday at 3:00 PM**
4. Create copy in: **Today**
5. Add the "Weekly Review" checklist from your Templates card

### Morning Standup Prep
1. Create card in Today: `Morning Standup Prep`
2. Repeat: **every weekday at 8:00 AM** > create in **Today**

### End of Day Status (optional)
1. Create card in Today: `End of Day Status Update`
2. Repeat: **every weekday at 4:30 PM** > create in **Today**

> Archiving a repeated card does NOT stop repetition. Only deleting or canceling the repeat stops it.

---

## Rule 5: Due Date Surfacing

**What it does:** Auto-moves cards to Today when their due date arrives.

### Rule 5a - Due date reached
1. Butler > **Rules** > **Create Rule**
2. Trigger: `when a card's due date is reached`
3. Action: `move the card to the top of list "Today"`
4. Save

### Rule 5b - Due date approaching (1 day before)
1. Butler > **Due Date** commands > **Create**
2. Trigger: `1 day before a card is due`
3. Actions:
   - `move the card to list "Today"`
   - `add label "Due Soon"` (the yellow label)
4. Save

> **Create the Due Soon label first** if you haven't already. It should be yellow, separate from energy labels.

---

## Rule 6: Auto-archive Done Cards

**What it does:** Keeps the board clean by archiving old Done cards.

1. Butler > **Calendar** > **Create Command**
2. Schedule: `every day at 11:00 PM`
3. Action: `archive all cards in list "Done" that have been in the list for more than 3 days`
4. Save

---

## Board Button: Clean Up Board

**What it does:** One-click emergency reset. Flattens the board back to a clean state.

1. Butler > **Board Buttons** > **Create Button**
2. Button name: `Clean Up Board`
3. Actions (add all three):
   - `archive all cards in list "Done"`
   - `move all cards in list "Doing" to the top of list "This Week"`
   - `move all cards in list "Today" to the top of list "This Week"`
4. Save

Use this when returning after ignoring the board, when things feel overwhelming, or anytime the board looks chaotic.

---

## Testing

After creating all rules:

1. Create a dummy card in This Week with a due date and checklist
2. Drag it: This Week > Today > Doing > Done
3. Verify at each stage:
   - **Doing:** Task Kickoff checklist added? 4-hour due date set? You joined the card?
   - **Done:** Due date marked complete? All checklist items checked?
4. Test the Clean Up Board button
5. Delete the test card
