<%= comment.start %>
<%= comment.line %> [<%= id %>] <%= name %>
<%= comment.line %>
<%= comment.line %> <%= link %>
<%= comment.line %>
<%= comment.line %> <%= category %>
<%= comment.line %> <%= level %> (<%= percent %>%)
<%= comment.line %> Total Accepted:    <%= totalAC %>
<%= comment.line %> Total Submissions: <%= totalSubmit %>
<%= comment.line %> Testcase Example:  <%= testcase %>
<%= comment.line %>
<% desc.forEach(function(x) { %><%= comment.line %> <%= x %>
<% }) %><%= comment.end %>
<%= code %>
