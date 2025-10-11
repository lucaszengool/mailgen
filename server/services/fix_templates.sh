#!/bin/bash

# Fix ModernEmailTemplates.js
sed -i '' 's/color: white;/color: #ffffff;/g' ModernEmailTemplates.js
sed -i '' 's/color: #E0E7FF/color: #ffffff/g' ModernEmailTemplates.js
sed -i '' 's/#667eea/#4CAF50/g' ModernEmailTemplates.js
sed -i '' 's/#764ba2/#45a049/g' ModernEmailTemplates.js
sed -i '' 's/#f093fb/#45a049/g' ModernEmailTemplates.js
sed -i '' 's/#1e3c72/#5a5a5a/g' ModernEmailTemplates.js
sed -i '' 's/#2a5298/#6a6a6a/g' ModernEmailTemplates.js
sed -i '' 's/#ff6b6b/#4CAF50/g' ModernEmailTemplates.js
sed -i '' 's/#4ecdc4/#4CAF50/g' ModernEmailTemplates.js
sed -i '' 's/#45b7d1/#4CAF50/g' ModernEmailTemplates.js
sed -i '' 's/#2c3e50/#5a5a5a/g' ModernEmailTemplates.js
sed -i '' 's/#34495e/#6a6a6a/g' ModernEmailTemplates.js
sed -i '' 's/#805ad5/#4CAF50/g' ModernEmailTemplates.js
sed -i '' 's/#6b46c1/#45a049/g' ModernEmailTemplates.js
sed -i '' 's/#ff9a9e/#4CAF50/g' ModernEmailTemplates.js
sed -i '' 's/#fecfef/#f5f5f5/g' ModernEmailTemplates.js

echo "Fixed ModernEmailTemplates.js"
