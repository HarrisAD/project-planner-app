curl -X POST http://localhost:3001/api/tasks \
 -H "Content-Type: application/json" \
 -d '{
"name": "Test Task",
"projectId": 1,
"assignee": "Alex",
"status": "Completed",
"rag": 1,
"dueDate": "2024-06-30",
"daysAssigned": 5,
"description": "This is a test task"
}'
