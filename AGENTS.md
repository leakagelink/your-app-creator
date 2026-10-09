<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep merchant deposit destinations in singleton app settings, separate from worker payout methods; admin-only RPCs control them to prevent payment redirection.
- Store merchant QR images in a private dedicated bucket and expose only the currently saved image to signed-in customers; worker payout QR access stays separate.
