export default async function({ addon }) {
    const sliders = Array.from(document.querySelectorAll('.box.slider-carousel-container'));

    function findSlider(keywords) {
        return sliders.find(box => {
            const title = box.querySelector('.box-head h4')?.textContent.toLowerCase() || '';
            return keywords.some(k => title.includes(k));
        }) || null;
    }

    const shared    = findSlider(["compartid", "shared", "partagé", "geteilt", "公開"]);
    const favorites = findSlider(["favorit", "favorites", "favoris", "favoriten", "收藏"]);
    const studiosFollowing = findSlider(["siguiendo estudios", "studios i follow", "studios que sigo", "suivis", "gefolgte studios", "追蹤工作室"]);
    const studiosCurated   = findSlider(["estudios que curo", "curated studios", "ateliers gérés", "verwaltete studios", "管理的工作室"]);
    const following = findSlider(["siguiendo", "following", "abonnements", "folgt", "關注"]);
    const followers = findSlider(["seguidores", "followers", "abonnés", "folger", "粉絲"]);

    function makeRow(left, right) {
        if (!left) return;
        const row = document.createElement('div');
        row.className = 'tm-compact-row';
        left.parentNode.insertBefore(row, left);
        row.appendChild(left);
        if (right) row.appendChild(right);
    }

    makeRow(shared, favorites);
    makeRow(studiosFollowing, studiosCurated);
    makeRow(following, followers);
}
