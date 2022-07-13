const core = require('@actions/core')
const github = require('@actions/github')

const main = async () => {
  try {
    // Fetching inputs
    const owner = core.getInput('owner', { required: true })
    const repo = core.getInput('repo', { required: true })
    const pr_number = core.getInput('pr_number', { required: true })
    const token = core.getInput('token', { required: true })

    // Create instance of Octokit needed for calling GitHub REST API endpoints
    const octokit = new github.getOctokit(token)

    // Fetch list of files with changes in the PR and store them
    const { data: changedFiles } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pr_number,
    })

    // Create an object which contains the sum of additions, deletions and changes in all the files
    let diffData = {
      additions: 0,
      deletions: 0,
      changes: 0,
    }

    diffData = changedFiles.reduce((acc, file) => {
      acc.additions += file.additions
      acc.deletions += file.deletions
      acc.changes += file.changes
      return acc
    }, diffData)

    // Loop over the files changed and add labels according to files types
    for (const file of changedFiles) {
      // Add label
      const fileExtension = file.filename.split('.').pop()
      switch(fileExtension) {
        case 'md':
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: pr_number,
            labels: ['markdown'],
          });
        case 'js':
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: pr_number,
            labels: ['javascript'],
          });
        case 'yml':
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: pr_number,
            labels: ['yaml'],
          });
        case 'yaml':
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: pr_number,
            labels: ['yaml'],
          })
      }
    }

    // Create a comment on the PR with the information we compiled from the list of changed files
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pr_number,
      body: `
        Pull Request #${pr_number} has been updated with: \n
        - ${diffData.changes} changes \n
        - ${diffData.additions} additions \n
        - ${diffData.deletions} deletions \n
      `
    })
  } catch (err) {
    core.setFailed(err.message)
  }
}

main()