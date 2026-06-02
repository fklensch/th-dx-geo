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
        List<Account> toInsert = new List<Account>();
        for (Request req : requests) {
            toInsert.add(new Account(
                Name = req.name,
                BillingCity = req.city,
                Phone = req.phone,
                Website = req.website
            ));
        }
        insert toInsert;
        for (Account a : toInsert) {
            Result r = new Result();
            r.recordId = a.Id;
            r.message = 'Created account "' + a.Name + '" with Id ' + a.Id + '.';
            results.add(r);
        }
        return results;
    }
}
