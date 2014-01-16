class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  helper_method :url_for

  def current_user_id
    @user_id ||= cookies[:user_id]
  end
end
