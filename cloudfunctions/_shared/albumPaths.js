function albumRoot(albumId) {
  return `albums/${albumId}`
}

function albumJsonPath(albumId) {
  return `${albumRoot(albumId)}/album.json`
}

function albumPosterPath(albumId) {
  return `${albumRoot(albumId)}/poster.jpg`
}

function albumShareImgPath(albumId) {
  return `${albumRoot(albumId)}/share/share-5x4.jpg`
}

module.exports = { albumRoot, albumJsonPath, albumPosterPath, albumShareImgPath }

