public with sharing class HotelAccountFinder {
    // Agent action: look up Account records by name.

    public class Request {
        @InvocableVariable(required=true label='Search Text'
            description='Full or partial hotel account name to search for')
        public String searchText;
    }
    public class Result {
        @InvocableVariable(label='Matches'
            description='Human-readable list of matching accounts with key fields and record Ids')
        public String matches;
    }

    @InvocableMethod(label='Find Hotel Accounts'
        description='Searches Account records by name (partial match) and returns up to 10 matches with key fields including the record Id.')
    public static List<Result> findAccounts(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            String term = req.searchText == null ? '' : req.searchText.trim();
            String pattern = '%' + term + '%';
            List<Account> accts = [
                SELECT Id, Name, Phone, Website, Industry, BillingCity, Description
                FROM Account
                WHERE Name LIKE :pattern
                ORDER BY Name
                LIMIT 10
            ];
            Result r = new Result();
            if (accts.isEmpty()) {
                r.matches = 'No accounts found matching "' + term + '".';
            } else {
                List<String> lines = new List<String>();
                for (Account a : accts) {
                    String line = a.Name + ' (Id: ' + a.Id + ')';
                    if (a.BillingCity != null) line += ', City: ' + a.BillingCity;
                    if (a.Phone != null) line += ', Phone: ' + a.Phone;
                    if (a.Industry != null) line += ', Industry: ' + a.Industry;
                    if (a.Website != null) line += ', Website: ' + a.Website;
                    if (a.Description != null) line += ', Description: ' + a.Description;
                    lines.add(line);
                }
                r.matches = String.join(lines, '\n');
            }
            results.add(r);
        }
        return results;
    }
}
