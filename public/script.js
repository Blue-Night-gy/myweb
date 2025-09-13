// 上传图片
document.getElementById('photoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  await fetch('/api/photos', {
    method: 'POST',
    body: formData
  });
  e.target.reset();
  fetchPhotos();
});

// 获取相册图片
async function fetchPhotos() {
  const res = await fetch('/api/photos');
  const photos = await res.json();
  const gallery = document.getElementById('photoGallery');
  gallery.innerHTML = photos.map(p => `<img src="${p.filename}" alt="photo">`).join('');
}

// 初始加载相册
fetchPhotos();
 
