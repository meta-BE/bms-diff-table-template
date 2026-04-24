deploy:
	git checkout deploy
	git merge main -X ours
	git push
	git checkout main
