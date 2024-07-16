({
  access: 'public',
  method: async (fileNames) => {
    console.log({ fileNames });
    // const fileIds = await context.client.prepareUpload(fileNames);

    // console.log({ fileIds });

    return { status: 'Stream initialized', response: 'OK' };
  },
});
