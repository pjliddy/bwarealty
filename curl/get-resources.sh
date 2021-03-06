curl  \
  --header "RETS-Version: RETS/1.7.2" \
  --digest \
  --user "RTESTB:H06W@4t5" \
  --output tmp/resources.xml \
  --dump-header tmp/headers.txt \
  --cookie-jar tmp/cookies.txt  \
  --cookie tmp/cookies.txt  \
  --data  Type=METADATA-RESOURCE  \
  --data  ID=0  \
  --data  Format=COMPACT  \
  --show-error \
  "http://fmlsrets.mlsmatrix.com/Rets/GetMetadata.ashx"
