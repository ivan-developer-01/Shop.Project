# Shop.Project

This is a project made by following Skillfactory course instructions. There were no goals to make it perfect - it is a learning project.

Its main features are the backend in `Shop.API/` that handles products, comments, and images, and the frontend in Shop.Admin.  
The database structure can be found at [structure.sql](./structure.sql); note that you will need to create an `admin` user first (after creating the above schema) if you want to explore the admin panel, for example:

```sql
INSERT INTO `users` (username, password) VALUES ("admin", "admin_super_password");
```

There is also an empty `Shop.Client` directory - I did not put anything there because there were no instructions to do so.
