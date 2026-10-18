const noComments = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: {
      forbidden: 'Comments are not allowed. Record the knowledge in the OpenSpec specs instead.'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode
    return {
      Program() {
        const scriptComments = sourceCode.getAllComments()
        const templateComments = sourceCode.ast.templateBody?.comments ?? []
        for (const comment of [...scriptComments, ...templateComments]) {
          context.report({ loc: comment.loc, messageId: 'forbidden' })
        }
      }
    }
  }
}

export default {
  meta: { name: '@luna/eslint-rules' },
  rules: { 'no-comments': noComments }
}
