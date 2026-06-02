public with sharing class HotelContactCreator {
    // Agent action: create a Contact, optionally linked to a hotel Account by name.

    public class Request {
        @InvocableVariable(required=true label='Last Name'
            description='Last name of the contact')
        public String lastName;
        @InvocableVariable(label='First Name' description='First name of the contact')
        public String firstName;
        @InvocableVariable(label='Email' description='Email address')
        public String email;
        @InvocableVariable(label='Phone' description='Phone number')
        public String phone;
        @InvocableVariable(label='Title' description='Job title or role')
        public String title;
        @InvocableVariable(label='Account Name'
            description='Name of the hotel account to link this contact to (optional)')
        public String accountName;
    }
    public class Result {
        @InvocableVariable(label='Record Id' description='Id of the new Contact')
        public String recordId;
        @InvocableVariable(label='Message' description='Confirmation message')
        public String message;
    }

    @InvocableMethod(label='Create Hotel Contact'
        description='Creates a Contact, optionally linked to a hotel Account by name, and returns its record Id.')
    public static List<Result> createContact(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Id accountId = null;
            String acctLabel = '';
            if (String.isNotBlank(req.accountName)) {
                List<Account> accts = [
                    SELECT Id, Name FROM Account WHERE Name = :req.accountName.trim() LIMIT 1
                ];
                if (!accts.isEmpty()) {
                    accountId = accts[0].Id;
                    acctLabel = ' linked to "' + accts[0].Name + '"';
                }
            }
            Contact c = new Contact(
                LastName = String.isBlank(req.lastName) ? 'Unknown' : req.lastName.trim(),
                FirstName = req.firstName,
                Email = req.email,
                Phone = req.phone,
                Title = req.title,
                AccountId = accountId
            );
            Database.DMLOptions dml = new Database.DMLOptions();
            dml.DuplicateRuleHeader.AllowSave = true;
            Database.insert(c, dml);

            Result r = new Result();
            r.recordId = c.Id;
            String fullName = (String.isNotBlank(req.firstName) ? req.firstName + ' ' : '') + c.LastName;
            r.message = 'Created contact ' + fullName + acctLabel + ' (Id ' + c.Id + ').';
            results.add(r);
        }
        return results;
    }
}
