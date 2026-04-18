#!/bin/bash
echo "Fixing user dropdown..."
cat >> static/css/style.css << "EOF"
.user-dropdown{position:fixed;top:80px;right:20px;width:300px;background:white;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,0.2);z-index:1001;animation:slideDown 0.3s}
@keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
EOF
echo "✅ Done! Restart Flask and refresh browser."
