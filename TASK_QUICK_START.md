# Task Completion System - Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Prerequisites
- Python 3.7+
- Backend dependencies installed (pip install -r requirements.txt)
- ReportLab for PDF generation

### Step 1: Start the Backend (30 seconds)

Open PowerShell/Command Prompt in the project directory:

```powershell
cd "BU ALU Portal\backend"
python app.py
```

You should see:
```
* Running on http://127.0.0.1:5000
```

### Step 2: Seed Sample Tasks (30 seconds)

Open another terminal window:

```powershell
cd "BU ALU Portal\backend"
python seed_tasks.py
```

You should see:
```
✓ Database initialized
✓ Created task: Advanced Leadership Workshop (TSK-xxx)
✓ Created task: Digital Marketing Fundamentals Seminar (TSK-xxx)
[... 8 more tasks ...]
✓ Successfully seeded 10 tasks
```

### Step 3: Access the Tasks Page (30 seconds)

Open your browser and navigate to:

```
http://localhost:5000/tasks.html
```

You should see 10 tasks displayed in a grid.

---

## 📋 Complete Task Workflow Test

### Test Scenario: Complete a Leadership Workshop

#### 1️⃣ Register for Task
1. Find "Advanced Leadership Workshop" in the tasks list
2. Click the blue **"Register for Task"** button
3. Fill in the registration form:
   - Name: `John Doe`
   - Email: `john@example.com`
   - Phone: `+256700000000`
4. Click **"Register"**
5. See confirmation: "Registration successful!"

#### 2️⃣ Complete the Task
1. Scroll to **"My Registrations"** section
2. Find your registered task
3. Click **"Mark as Complete"** button
4. Fill in completion details:
   - Hours Spent: `8`
   - Receipt Amount (optional): `50000`
5. Click **"Complete Task"**
6. See confirmation: "Task completed successfully!"

#### 3️⃣ Download Documents
1. Scroll to **"My Completions"** section
2. Find your completed task
3. Download documents:
   - Click **"Download Certificate"** → Saves to your Downloads folder
   - Click **"Download Ticket"** → Saves to your Downloads folder
   - Click **"Download Receipt"** → Saves to your Downloads folder
4. Open PDFs to verify content

#### 4️⃣ Submit Feedback
1. After completing the task, **Feedback Modal** appears automatically
2. Rate the task: Click on **stars** (1-5) to rate
3. Add comment (optional): Type feedback in text area
4. Check box (optional): "I would recommend this task"
5. Click **"Submit Feedback"**
6. See confirmation: "Feedback submitted successfully!"

---

## 📊 What Gets Generated

### When You Complete a Task:

#### 1. Certificate (landscape PDF)
```
[BU Logo]

    Certificate of Achievement

    This certifies that
    John Doe
    
    Has successfully completed:
    Advanced Leadership Workshop
    
    Duration: 8 hours
    Certificate #: CERT-XXX-XXXX
    Date Issued: May 6, 2024
    
    ________________          ________________
    Organizer Signature       Authorized Signature
```

#### 2. Ticket (portrait PDF)
```
[BU Logo]

    WORKSHOP TICKET
    
    Event: Advanced Leadership Workshop
    Participant: John Doe
    Ticket #: TICKET-XXX-XXXX
    Issue Date: May 6, 2024
    Status: Active
```

#### 3. Receipt (portrait PDF)
```
[BU Logo]

    PARTICIPATION RECEIPT
    
    Recipient: John Doe
    Activity: Advanced Leadership Workshop
    Amount: UGX 50,000
    Receipt #: RCP-XXX-XXXX
    Date: May 6, 2024
```

---

## 🧪 Test Scenarios

### Scenario 1: Complete Multiple Tasks
1. Register for 3-4 different tasks
2. Complete each with different hours
3. Download all documents
4. Submit feedback for each
5. Verify all appear in "My Completions"

### Scenario 2: Test Different Categories
- Try: Workshop → Certificate
- Try: Training → Certificate + Receipt
- Try: Seminar → All documents
- Try: Conference → Ticket as primary

### Scenario 3: Track Points Earned
1. Complete a workshop (8 hours) → Earns points
2. Complete a bootcamp (40 hours) → Earns more points
3. View user completions → Points accumulated

### Scenario 4: Feedback Variations
- Rate 5 stars with high praise
- Rate 3 stars with constructive feedback
- Rate 1 star with improvement suggestions
- Test with/without recommendation

---

## 📁 File Locations

### Generated Documents Saved To:

**Certificates:**
```
backend/data/certificates/CERT-XXXXX.pdf
```

**Tickets:**
```
backend/data/tickets/TICKET-XXXXX.pdf
```

**Receipts:**
```
backend/data/donation_letters/RCP-XXXXX.pdf
```

All PDFs are automatically created when task is marked complete.

---

## ❌ Troubleshooting

### Issue: "Cannot find tasks"
**Solution:** 
1. Verify seed_tasks.py ran successfully
2. Check database exists: `backend/data/bu_alumni.db`
3. Restart backend with `python app.py`

### Issue: "PDFs not generating"
**Solution:**
1. Ensure ReportLab installed: `pip install reportlab`
2. Check directories exist: `backend/data/certificates/`, `tickets/`, `donation_letters/`
3. Verify logo file: `image/Bugema_logo.png`

### Issue: "API returns 404 error"
**Solution:**
1. Verify backend running on `http://localhost:5000`
2. Check API endpoint names in browser console
3. Verify user email is valid format

### Issue: "Modal not showing"
**Solution:**
1. Check browser console for JavaScript errors
2. Verify Material Icons loaded (inspect Network tab)
3. Refresh page and try again

### Issue: "Download doesn't work"
**Solution:**
1. Check popup blocker settings
2. Verify PDF file exists in data directory
3. Try different browser (Chrome, Firefox)

---

## 📚 Full Documentation

For complete documentation, see:
- **API Details:** `TASK_SYSTEM.md`
- **Implementation Checklist:** `TASK_IMPLEMENTATION_CHECKLIST.md`
- **Main README:** `README.md`

---

## 🎯 Expected Results

After following this guide, you should have:

✅ 10 sample tasks visible in the portal
✅ Ability to register for any task
✅ Automatic PDF generation on completion
✅ All documents downloading successfully
✅ Feedback system working
✅ Complete task history visible

---

## 🚀 Ready to Deploy?

Once you've tested the workflow:

1. Verify all PDFs generate correctly
2. Test with different user accounts
3. Check document downloads work on multiple browsers
4. Confirm feedback saves properly
5. Review API logs for errors

**Then you're ready for production! 🎉**

---

## 💡 Pro Tips

1. **Test with Real Data:** Use actual email addresses you can access
2. **Try Edge Cases:** Test with minimum hours (0) and large amounts
3. **Check Email Validation:** Try invalid emails to see error handling
4. **Mobile Test:** Open tasks.html on a phone to verify responsive design
5. **Document Verification:** Open PDFs to verify all data is correct

---

## 📞 Support

Need help? Check:
1. Browser console (F12) for JavaScript errors
2. Backend terminal for API errors
3. `backend/data/bu_alumni.db` for database status
4. TASK_SYSTEM.md for API documentation

Happy testing! 🎊
