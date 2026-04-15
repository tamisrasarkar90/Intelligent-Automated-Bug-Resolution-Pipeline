ï»¿#if NETFRAMEWORK //SYSTEM_WEB_NETFRAMEWORK
using Microsoft.Win32;
using System;
using System.Web.Configuration;
using System.Web.UI;

using Hyland.Logging;
using Hyland.Web.Resources.Scripts;
using System.Linq;


// Any new resources must have an associated [assembly: WebResource(...)] attribute
[assembly: WebResource(EmbeddedScripts.DataValidationBase, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.DataValidation2008, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.DataValidation2012, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.DataValidation2016, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.DataValidation2019, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.DataValidation2022, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.DataValidation2025, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.HylandInterop, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.OBCommon, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.OBNotification, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.DialogManager, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.PromisesPolyfill, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.OBCommonLegacyPolyfill, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.WindowActions, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.CreatePopup, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.UnityFormUserPreferenceStorage, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.WebServiceProvider, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.Keyboard, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.UnloadManager, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.json2, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.DocumentActions, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.OBStorage, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.WindowsManager, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.ResizeContainer, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.FilterBox, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.FlexResize, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.DataAccess, "text/javascript")]
[assembly: WebResource("Hyland.Web.Resources.Scripts.Tests.OBCommon-test.js", "text/javascript")]
[assembly: WebResource(EmbeddedScripts.WorkflowTaskHandler, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.OBPopover, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.Messenger, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.LoadIndicator, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.WindowsManagerConfiguration, "text/xml")]
[assembly: WebResource(EmbeddedScripts.ContentManager, "text/javascript")]
[assembly: WebResource(EmbeddedScripts.SidePanelManager, "text/javascript")]
namespace Hyland.Web.Resources.Scripts
{
	/// <summary>
	/// Helper class to obtain resources from this assembly.
	/// 
	/// In order to use any of the embedded script files in this assembly, use the static helper methods:
	///     - GetWebResourceUrl
	///     - RegisterClientScriptResource
	/// </summary>
	public class EmbeddedScripts
    {
        // Add new string constants here that point to resources in the assembly.  If an embedded resource
        // exists in a subdirectory, the string constant must be in the following format:
        //      --> public const string SubDirExample = "Hyland.Web.Resources.Scripts.SubDirectoryName.SubDirExample.js";
        public const string OBStorage = "Hyland.Web.Resources.Scripts.OBStorage.js";
		public const string DataValidationBase = "Hyland.Web.Resources.Scripts.DataValidation.js";
		public const string DataValidation2008 = "Hyland.Web.Resources.Scripts.DataValidation2008.js";
		public const string DataValidation2012 = "Hyland.Web.Resources.Scripts.DataValidation2012.js";
		public const string DataValidation2016 = "Hyland.Web.Resources.Scripts.DataValidation2016.js";
		public const string DataValidation2019 = "Hyland.Web.Resources.Scripts.DataValidation2019.js";
		public const string DataValidation2022 = "Hyland.Web.Resources.Scripts.DataValidation2022.js";
		public const string DataValidation2025 = "Hyland.Web.Resources.Scripts.DataValidation2025.js";
		public const string HylandInterop = "Hyland.Web.Resources.Scripts.HylandInterop.js";
        public const string OBCommon = "Hyland.Web.Resources.Scripts.OBCommon.js";
        public const string OBCommonLegacyPolyfill = "Hyland.Web.Resources.Scripts.OBCommonLegacyPolyfill.js";
        public const string WindowActions = "Hyland.Web.Resources.Scripts.WindowActions.js";
        public const string CreatePopup = "Hyland.Web.Resources.Scripts.CreatePopup.js";
        public const string UnityFormUserPreferenceStorage = "Hyland.Web.Resources.Scripts.UnityFormUserPreferenceStorage.js";
        public const string WebServiceProvider = "Hyland.Web.Resources.Scripts.WebServiceProvider.js";
        public const string Keyboard = "Hyland.Web.Resources.Scripts.Keyboard.js";
        public const string UnloadManager = "Hyland.Web.Resources.Scripts.UnloadManager.js";
		public const string json2 = "Hyland.Web.Resources.Scripts.json2.js";
		public const string DocumentActions = "Hyland.Web.Resources.Scripts.DocumentActions.js";
        public const string WindowsManager = "Hyland.Web.Resources.Scripts.WindowsManager.js";
		public const string DialogManager = "Hyland.Web.Resources.Scripts.DialogManager.js";
		public const string PromisesPolyfill = "Hyland.Web.Resources.Scripts.PromisesPolyfill.js";
        public const string ResizeContainer = "Hyland.Web.Resources.Scripts.ResizeContainer.js";
        public const string FilterBox = "Hyland.Web.Resources.Scripts.FilterBox.js";
        public const string FlexResize = "Hyland.Web.Resources.Scripts.FlexResize.js";
        public const string OBNotification = "Hyland.Web.Resources.Scripts.OBNotification.js";
        public const string DataAccess = "Hyland.Web.Resources.Scripts.DataAccess.js";
		public const string WorkflowTaskHandler = "Hyland.Web.Resources.Scripts.WorkflowTaskHandler.js";
        public const string OBPopover = "Hyland.Web.Resources.Scripts.OBPopover.js";
		public const string Messenger = "Hyland.Web.Resources.Scripts.Messenger.js";
		public const string LoadIndicator = "Hyland.Web.Resources.Scripts.LoadIndicator.js";
		public const string WindowsManagerConfiguration = "Hyland.Web.Resources.Scripts.WindowsManagerConfiguration.xml";
		public const string ContentManager = "Hyland.Web.Resources.Scripts.ContentManager.js";
        public const string SidePanelManager = "Hyland.Web.Resources.Scripts.SidePanelManager.js";
        public static readonly string DataValidation;
		private const string DefaultDataValidation = "2022";
		private static readonly string[] SupportedDVOverrides = { "2008", "2012", "2016", "2019", "2022", "2025" };

        #region Static Helpers
		static EmbeddedScripts()
		{
			DataValidation = PickDataValidationVersion();
		}

		private static string PickDataValidationVersion()
		{
			string dataValidationResourceName = "Hyland.Web.Resources.Scripts.DataValidation";
			string dvOverride = WebConfigurationManager.AppSettings["WindowsServerLocaleFormat"]?.Trim();

			//if no preference is set, or it is incorrectly configured, we'll have to determine what server version they're running
			if (!SupportedDVOverrides.Contains(dvOverride))
			{
				string osName = string.Empty;
				//query the registry for OS version
				try
				{
					RegistryKey rk = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion");
					if (rk != null)
					{
						osName = (string)rk.GetValue("ProductName");
					}

					//if the registry key or entry doesn't exist (which shouldn't happen), use default.
					if (rk == null || osName == null)
					{
						osName = DefaultDataValidation;
						ErrorViewerWriter.WriteMessage($"Failed to detect OS version. Defaulting to {DefaultDataValidation}");
					}
					else
					{
						//for server versions we can just check for the year, which involves some string manipulation
						if (osName.Contains("Server"))
						{
							int indexServer = osName.IndexOf("Server") + 7;
							int secondIndex = osName.IndexOf(" ", indexServer + 1);
							if (secondIndex == -1)
							{
								osName = osName.Substring(indexServer);
							}
							else
							{
								osName = osName.Substring(indexServer, secondIndex - indexServer);
							}
						}
						//for workstation equivalents, we need to check for a space followed by the version
						//so as to not detect 2008 as windows 8, because they are not equivalent.
						else if (osName.Contains(" 7"))
						{
							//just set the osName, because it just gets appended to the base datavalidation file name.
							osName = "2008";
						}
						else if (osName.Contains(" 8") || osName.Contains(" 8.1"))
						{
							osName = "2012";
						}
						else if(osName.Contains(" 10"))
						{
							osName = "2019";
						}
						else if(osName.Contains(" 11"))
						{
							osName = "2022";
						}
						else //can't determine OS. use default.
						{
							osName = DefaultDataValidation;
						}
					}
				}
				catch (Exception ex)
				{
					ErrorViewerWriter.Write(ex);

					//something failed, so use default
					osName = DefaultDataValidation;
				}
				dataValidationResourceName += osName;
			}
			else //preference is set in web.config, use that.
			{
				dataValidationResourceName += dvOverride;
			}

			dataValidationResourceName += ".js";
			if (!(dataValidationResourceName.Equals(DataValidation2008)
				|| dataValidationResourceName.Equals(DataValidation2012)
				|| dataValidationResourceName.Equals(DataValidation2016)
				|| dataValidationResourceName.Equals(DataValidation2019)
				|| dataValidationResourceName.Equals(DataValidation2022)
				|| dataValidationResourceName.Equals(DataValidation2025)))
			{
				ErrorViewerWriter.WriteMessage($"DataValidation reference {dataValidationResourceName} is invalid. Resorting to default.");
				dataValidationResourceName = DataValidation2022;
			}
			return dataValidationResourceName;
		}

		/// <summary>
		/// Gets a URL reference to an embedded resource in this assembly.
		/// </summary>
		/// <param name="page">The System.Web.UI.Page object off of which the ClientScript manager will be obtained.</param>
		/// <param name="resourceName">The name of the resource in this assembly.</param>
		/// <returns>A URL corresponding to the requested embedded resource.</returns>
		public static string GetWebResourceUrl(Page page, string resourceName)
        {
			
            if (page == null)
            {
                throw new ArgumentNullException("The Page object cannot be null.");
            }
            return page.ClientScript.GetWebResourceUrl(typeof(EmbeddedScripts), resourceName);
        }

        /// <summary>
        /// Registers a client script resource with the System.Web.UI.Page object using an embedded resource in this assembly.
        /// </summary>
        /// <param name="page">The System.Web.UI.Page object off of which the ClientScript manager will be obtained.</param>
        /// <param name="resourceName">The name of the resource in this assembly.</param>
        public static void RegisterClientScriptResource(Page page, string resourceName)
        {
            if (page == null)
            {
                throw new ArgumentNullException("The Page object cannot be null.");
            }
            page.ClientScript.RegisterClientScriptResource(typeof(EmbeddedScripts), resourceName);
        }

		/// <summary>
		/// Gets a fully formatted script tag element, for the specified resource. 
		/// </summary>
		/// <param name="page">The System.Web.UI.Page object off of which the ClientScript manager will be obtained.</param>
		/// <param name="resourceName">The name of the resource in this assembly.</param>
		/// <param name="id">The optional id attribute to be used for the script element</param>
		/// <returns></returns>
		public static string GetWebResourceScriptBlock(Page page, string resourceName, string id = null)
		{
			if (page == null)
			{
				throw new ArgumentNullException("The Page object cannot be null.");
			}

			return page.ClientScript.GetWebResourceScriptElement(typeof(EmbeddedScripts), resourceName, id);
		}

		/// <summary>
		/// Gets a literal script control for the specified resource.
		/// </summary>
		/// <param name="page">The System.Web.UI.Page object off of which the ClientScript manager will be obtained.</param>
		/// <param name="resourceName">The name of the resource in this assembly.</param>
		/// <param name="id">The optional id attribute to be used for the script element</param>
		/// <returns></returns>
		public static LiteralControl GetWebResourceScriptControl(Page page, string resourceName, string id = null) 
		{
			return new LiteralControl(GetWebResourceScriptBlock(page, resourceName, id));
		}

        #endregion
    }
}
#endif
