#!/bin/bash

TARGET="http://127.0.0.1:8088"

echo "================================="
echo "NORMAL REQUEST"
echo "================================="

curl -s -o /dev/null \
  -w "HTTP %{http_code}\n" \
  "$TARGET/?search=hello"

echo
echo "================================="
echo "SQL INJECTION"
echo "================================="

curl -s -o /dev/null \
  -w "HTTP %{http_code}\n" \
  "$TARGET/?id=1%20OR%201=1"

echo
echo "================================="
echo "XSS"
echo "================================="

curl -s -o /dev/null \
  -w "HTTP %{http_code}\n" \
  "$TARGET/?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E"

echo
echo "================================="
echo "PATH TRAVERSAL"
echo "================================="

curl -s -o /dev/null \
  -w "HTTP %{http_code}\n" \
  "$TARGET/?file=../../../../etc/passwd"

echo
echo "================================="
echo "COMMAND INJECTION PATTERN"
echo "================================="

curl -s -o /dev/null \
  -w "HTTP %{http_code}\n" \
  "$TARGET/?cmd=cat%20/etc/passwd"
