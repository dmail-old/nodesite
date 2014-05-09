Config is the central point to set configuration of your application.

Key               | Description                 | Default           | Possible values
-------------     | -------------               | -------------     | -------------
protocol          | website protocol            | 'http'            | 'http', 'https'
host              | website host                | '127.0.0.1'       | any valid host
port              | website port                | 80                | Number
charset           | website charset             | 'utf8'            | 'utf8'
lang              | website language            | 'fr'              | 'fr', 'en'
local             | Is server running in trusted env? | true        | true, false
debug             | Display detailled error     | true              | true, false
debug_modules     | Will test module on launch  | false             | true, false
-------------     | -------------               | -------------     | -------------
css               | css files to server to client | "site", "resize", "box", "popup", "selectionRectangle", "selector", "editor" | Array of String
