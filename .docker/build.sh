BRANCH=$(jq --raw-output .ref "${GITHUB_EVENT_PATH}");
BRANCH=$(echo "${BRANCH/refs\/heads\//}")
BRANCH="$(echo "$BRANCH" | sed -r 's/\//_/g')"
NAME="storyscript/graphql"

docker build \
  -t $NAME:$BRANCH \
  .

if [ $BRANCH = 'master' ]; then
  docker tag $NAME:$BRANCH $NAME:latest
  echo "Successfully tagged $NAME:latest"
  echo ""
  echo "Pushing $NAME:latest"
  docker push $NAME:latest
fi

echo ""
echo "Pushing $NAME:$BRANCH"
docker push $NAME:$BRANCH
echo ""
echo "Pushing $NAME:$BRANCH"
docker push $NAME:$BRANCH
