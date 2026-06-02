public with sharing class HotelTaskCreator {
    // Agent action: create a follow-up Task (reminder/action), optionally linked to a hotel Account.

    public class Request {
        @InvocableVariable(required=true label='Subject'
            description='What the follow-up is about, e.g. "Send proposal to Pacific Crest Hotel"')
        public String subject;
        @InvocableVariable(label='Due Date' description='Due date in YYYY-MM-DD format')
        public String dueDate;
        @InvocableVariable(label='Account Name'
            description='Name of the hotel account this task relates to (optional)')
        public String accountName;
        @InvocableVariable(label='Notes' description='Additional details for the task')
        public String notes;
    }
    public class Result {
        @InvocableVariable(label='Record Id' description='Id of the new Task')
        public String recordId;
        @InvocableVariable(label='Message' description='Confirmation message')
        public String message;
    }

    @InvocableMethod(label='Create Follow-up Task'
        description='Creates a follow-up Task (a reminder/action item), optionally linked to a hotel Account, and returns its record Id.')
    public static List<Result> createTask(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Id whatId = null;
            String acctLabel = '';
            if (String.isNotBlank(req.accountName)) {
                List<Account> accts = [
                    SELECT Id, Name FROM Account WHERE Name = :req.accountName.trim() LIMIT 1
                ];
                if (!accts.isEmpty()) {
                    whatId = accts[0].Id;
                    acctLabel = ' on "' + accts[0].Name + '"';
                }
            }
            Date due = null;
            if (String.isNotBlank(req.dueDate)) {
                try { due = Date.valueOf(req.dueDate.trim()); } catch (Exception e) { due = null; }
            }
            Task t = new Task(
                Subject = req.subject,
                ActivityDate = due,
                WhatId = whatId,
                Description = req.notes,
                Status = 'Not Started',
                Priority = 'Normal'
            );
            insert t;

            Result r = new Result();
            r.recordId = t.Id;
            r.message = 'Created follow-up task "' + req.subject + '"'
                + (due != null ? ' due ' + String.valueOf(due) : '')
                + acctLabel + ' (Id ' + t.Id + ').';
            results.add(r);
        }
        return results;
    }
}
