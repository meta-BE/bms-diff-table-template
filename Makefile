deploy:
	git checkout deploy
	git merge main -X ours
	@echo ""
	@echo "=== マージ内容 ==="
	@git log --oneline deploy...deploy@{1}
	@echo ""
	@echo "=== 変更ファイル一覧 ==="
	@git diff --stat deploy@{1} deploy
	@echo ""
	@read -p "pushしますか？ (y/N): " confirm && [ "$$confirm" = "y" ] || (echo "中断します。deploy ブランチのままです。" && exit 1)
	git push
	git checkout main
