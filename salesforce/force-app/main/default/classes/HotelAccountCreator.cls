public with sharing class HotelAccountCreator {
    // Agent action: create a new hotel Account record.

    public class Request {
        @InvocableVariable(required=true label='Account Name'
            description='Name of the hotel account to create')
        public String name;
        @InvocableVariable(label='City' description='Billing city')
        public String city;
        @InvocableVariable(label='Phone' description='Phone number')
        public String phone;
        @InvocableVariable(label='Website' description='Website URL')
        public String website;
    }
    public class Result {
        @InvocableVariable(label='Record Id' description='Id of the newly created Account')
        public String recordId;
        @InvocableVariable(label='Message' description='Confirmation message')
        public String message;
    }

    @InvocableMethod(label='Create Hotel Account'
        description='Creates a new Account record for a hotel with the provided details and returns its record Id.')
    public static List<Result> createAccount(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            String nm = req.name == null ? '' : req.name.trim();
            // Idempotent: reuse an existing same-name account instead of duplicating it.
            List<Account> existing = [SELECT Id, Name FROM Account WHERE Name = :nm LIMIT 1];
            if (!existing.isEmpty()) {
                r.recordId = existing[0].Id;
                r.message = 'Account "' + existing[0].Name + '" already exists (Id ' + existing[0].Id + ') — reusing it.';
                results.add(r);
                continue;
            }
            Account a = new Account(
                Name = nm,
                BillingCity = req.city,
                Phone = req.phone,
                Website = req.website
            );
            // Don't let standard duplicate rules block the demo.
            Database.DMLOptions dml = new Database.DMLOptions();
            dml.DuplicateRuleHeader.AllowSave = true;
            Database.insert(a, dml);
            r.recordId = a.Id;
            r.message = 'Created account "' + a.Name + '" with Id ' + a.Id + '.';
            results.add(r);
        }
        return results;
    }
}
