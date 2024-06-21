# frontend_backend_message_passing_central_repository_v0

The purpose of this repository is to serve as a way to start BackEnd processes on GitHub Actions, using a database file system organization. Using the JavaScript functions in [library_to_run_GitHub_Actions.js](https://github.com/CodeSolutions2/library_to_run_GitHub_Actions) in any repository, one can create files in this repository containing input from any FrontEnd application. The created files containing the FrontEnd application inputs/data, trigger GitHub Action workflows (on the BackEnd) that automatically process the data in the file/s. The repository that runs the JavaScript functions inside the "library_to_run_GitHub_Actions.js" script, should have a GitHub Action workflow that monitors the change of a specific file name (ie: temp) inside the frontend_backend_message_passing_central_repository_v0 repository.

## Steps to set-up a repository like frontend_backend_message_passing_central_repository_v0:

a. Create a public repository (ie: frontend_backend_message_passing_central_repository_v0)

b. Create fine-grained personal access token: Settings - create fine-grained personal access token (follow the steps at [GitHub docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens))
- Repository Access: only select repositories - select repositories -  repoOwner/frontend_backend_message_passing_central_repository_v0
    - Permissions: 
        - Repository permissions - Contents (Read and Write), Metadata (Read)
        - Organization permission: none
    
c. Setup Organization verification of token: Settings - Your Organizations (left bar changes to Organizations) - Settings - (on left bar) Personal access tokens - Settings
  - Fine-grained personal access tokens: Allow access via fine-grained personal access tokens 
  - Require approval of fine-grained personal access tokens : Require administrator approval 
  - Personal access token (classic) : Allow access via personal access tokens (classic)

d. Put the key into GitHub Secrets for the frontend_backend_message_passing_central_repository_v0 repository. Settings - Secrets and variables - Actions - New repository secret. I called my key REPOB_V0.

e. Write a .yaml workflow that takes the REPOB_V0 key from GitHub Secrets, encodes the key so it is non-visible (non recognizable to viewers), and save it in a .github/.env file in the frontend_backend_message_passing_central_repository_v0 repository. 
  - The .yaml workflow is located at [.github/workflows/reset_key_automatically.yaml](https://github.com/CodeSolutions2/frontend_backend_message_passing_central_repository_v0/blob/main/.github/workflows/reset_key_automatically.yaml)
  - In the script:
      - the REPOB_V0 key is retreived from Github Secrets,
      - salt is created (concept about salting: https://en.wikipedia.org/wiki/Salt_%28cryptography%29) and salt is added to the key, such that 1 to n extra random characters are added to the beginning or end of the key (n=1 or 2),
      - the characters of the salted key are scrambled/mixed-up because GitHub will automatically recognize the key even if it is base64 encoded
      - base64 encode the salted scrambled key
      - save the the base64 encoded key to the .github/.env file

   Feel free to use other methods for making your key non-visible. 
