exports.getImage = async (req, res) => {
  const fileName = req.params.filename

  const options = {
    root: __dirname + '../../../storage/images/resized/',
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }

  res.sendFile(fileName, options)
}

exports.getCollectionImage = async (req, res) => {
  const collection = req.params.collection
  const folderId = req.params.folder
  const fileName = req.params.filename

  const options = {
    root: __dirname + `../../../storage/assistants/${collection}/images/${folderId}/`,
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }

  res.sendFile(fileName, options)
}
