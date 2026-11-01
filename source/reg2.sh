cd /tmp/claude-0/-home-claude/d0f961c0-bf6f-5078-a054-6532f3567bf7/scratchpad/qa
for d in pyq rtp mod fr frp fm mtp aud artp amtp mtp26; do (cd $d; for j in *.json; do n=${j%.json}; case $n in *_pairs|*_log|M1A|M2A|M1Q|M2Q) continue;; esac; echo "## $d/$n"; node t7.js $n 2>&1|sed 1d; done); done
