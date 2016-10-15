<%= commentHeader %>
<%= commentLine %> [<%= id %>] <%= name %>
<%= commentLine %>
<%= commentLine %> <%= link %>
<%= commentLine %>
<%= commentLine %> <%= level %> (<%= percent %>%)
<%= commentLine %> Total Accepted:    <%= totalAC %>
<%= commentLine %> Total Submissions: <%= totalSubmit %>
<%= commentLine %> Testcase Example:  <%= testcase %>
<%= commentLine %>
<% _.each(desc, function(x) { %><%= commentLine %> <%= x %>
<% }) %><%= commentFooter %>
<%= code %>
