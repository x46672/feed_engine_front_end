class Project
  extend ActiveModel::Naming
  include ActiveModel::Conversion

  attr_accessor :name, :github_url, :valid

  def self.create(attributes = {})
    status, project_data = project_api.create_with({ :project => attributes })
    [status, new(project_data)]
  end

  def initialize(data = {})
    @name       = data[:name]
    @github_url = data[:github_url]
    @valid      = data[:valid]
  end

  def self.all_for(user_id)
    project_api.projects_for(user_id)
  end

  def valid?
    valid
  end

  def self.project_api
    foofo_api::Project.new
  end

  def self.foofo_api
    FooFoBerry
  end

end
